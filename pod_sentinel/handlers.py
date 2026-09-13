import json
import time
import threading
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from kubernetes import client, config
import random


ANY_HOSTNAME_REGEX_PATTERN = ".*$"
KUBERNETES_NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
PENDING_STATUS = "pending"

config_state = {
    "grace_period_seconds": 60,
    "max_notifications_per_pod": 2
}

pending_pod_cache = {}
cache_lock = threading.Lock()

_k8s_client = None
_namespace = None


def _get_k8s_client():
    global _k8s_client, _namespace
    if _k8s_client is None:
        config.load_incluster_config()
        _k8s_client = client.CoreV1Api()
        with open(KUBERNETES_NAMESPACE_PATH) as f:
            _namespace = f.read().strip()
    return _k8s_client, _namespace


def get_pending_pod_status():
    # # Use for testing purposes
    # if random.random() < 0.8:  # 80% chance of simulating pending pods
    #     return {
    #         "alert": True,
    #         "pending_pods_count": random.randint(1, 10),
    #         "max_pending_duration_seconds": round(random.uniform(45.0, 300.0), 2)
    #     }
    # else:
    #     return {
    #         "alert": False,
    #         "pending_pods_count": 0,
    #         "max_pending_duration_seconds": 0.0
    #     }
        
    v1, namespace = _get_k8s_client()
    pods = v1.list_namespaced_pod(namespace=namespace)
    current_time = time.time()
    current_uids = set()
    max_pending_duration = 0
    alert = False
    pending_count = 0

    with cache_lock:
        for pod in pods.items:
            if pod.status.phase.lower() != PENDING_STATUS:
                continue

            uid = pod.metadata.uid
            current_uids.add(uid)
            pending_count += 1

            if uid not in pending_pod_cache:
                pending_pod_cache[uid] = {
                    "first_seen": current_time,
                    "notification_count": 0
                }

            entry = pending_pod_cache[uid]
            pending_duration = current_time - entry["first_seen"]

            if pending_duration < config_state["grace_period_seconds"]:
                continue

            max_pending_duration = max(max_pending_duration, pending_duration)

            if entry["notification_count"] < config_state["max_notifications_per_pod"]:
                entry["notification_count"] += 1
                alert = True

        _cleanup_stale_cache_entries(current_uids)

    return {
        "alert": alert,
        "pending_pods_count": pending_count,
        "max_pending_duration_seconds": round(max_pending_duration, 2)
    }


def _cleanup_stale_cache_entries(current_uids):
    stale_uids = set(pending_pod_cache.keys()) - current_uids
    for uid in stale_uids:
        del pending_pod_cache[uid]


def _validate_config_update(body):
    errors = []
    
    if "grace_period_seconds" in body:
        value = body["grace_period_seconds"]
        try:
            grace_period = int(value)
            if grace_period < 0:
                errors.append("grace_period_seconds must be non-negative")
        except (ValueError, TypeError):
            errors.append("grace_period_seconds must be a valid integer")
    
    if "max_notifications_per_pod" in body:
        value = body["max_notifications_per_pod"]
        try:
            max_notifications = int(value)
            if max_notifications < 0:
                errors.append("max_notifications_per_pod must be non-negative")
        except (ValueError, TypeError):
            errors.append("max_notifications_per_pod must be a valid integer")
    
    return errors


class PodSentinelStatusHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.set_header('Content-Type', 'application/json')
        try:
            result = get_pending_pod_status()
            self.write(json.dumps(result))
        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": str(e)}))
        finally:
            self.finish()


class PodSentinelConfigHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        self.set_header('Content-Type', 'application/json')
        try:
            body = self.get_json_body()
            validation_errors = _validate_config_update(body)
            
            if validation_errors:
                self.set_status(400)
                self.write(json.dumps({
                    "error": "Validation failed",
                    "details": validation_errors
                }))
                return
            
            if "grace_period_seconds" in body:
                config_state["grace_period_seconds"] = int(body["grace_period_seconds"])
            if "max_notifications_per_pod" in body:
                config_state["max_notifications_per_pod"] = int(body["max_notifications_per_pod"])
            
            self.write(json.dumps({"status": "ok", "config": config_state}))
        except Exception as e:
            self.set_status(400)
            self.write(json.dumps({"error": str(e)}))
        finally:
            self.finish()


def setup_handlers(server_app):
    host_pattern = ANY_HOSTNAME_REGEX_PATTERN
    base_url = server_app.web_app.settings["base_url"]

    handlers = [
        (url_path_join(base_url, "pod-sentinel/status"), PodSentinelStatusHandler),
        (url_path_join(base_url, "pod-sentinel/config"), PodSentinelConfigHandler),
    ]

    server_app.web_app.add_handlers(host_pattern, handlers)