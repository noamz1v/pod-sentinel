export interface IPodSentinelSettings {
  pollingEnabled: boolean;
  pollIntervalMs: number;
  gracePeriodSeconds: number;
  maxNotificationsPerPod: number;
}

export interface IPendingPodsResponse {
  alert: boolean;
  pending_pods_count: number;
  max_pending_duration_seconds: number;
}

export interface IBackendConfig {
  grace_period_seconds: number;
  max_notifications_per_pod: number;
}

export interface IBackendConfigResponse {
  status: string;
  config: IBackendConfig;
}
