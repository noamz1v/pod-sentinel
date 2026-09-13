export interface PodSentinelSettings {
    pollingEnabled: boolean;
    pollIntervalMs: number;
    gracePeriodSeconds: number;
    maxNotificationsPerPod: number;
}

export interface PendingPodsResponse {
    alert: boolean;
    pending_pods_count: number;
    max_pending_duration_seconds: number;
}

export interface BackendConfig {
    grace_period_seconds: number;
    max_notifications_per_pod: number;
}

export interface BackendConfigResponse {
    status: string;
    config: BackendConfig;
}