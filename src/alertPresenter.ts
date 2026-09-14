import { showErrorMessage } from '@jupyterlab/apputils';
import { IPendingPodsResponse } from './types';

function buildAlertMessage(response: IPendingPodsResponse): string {
  const durationText = response.max_pending_duration_seconds > 0
    ? ` (longest pending pod: ${Math.round(response.max_pending_duration_seconds)}s)`
    : '';

  return `⚠️ ${response.pending_pods_count} pod(s) are stuck in pending state${durationText}.
                This usually means your current user / group has exceeded its resource quota. 👉 To resolve this: 1. Stop idle CAI sessions to free up resources. 2. Reduce your resource configuration for the session 3. Contact your administrator for higher resource quotas. You can disable or customize these alerts from JupyterLab Settings Editor (Ctrl + , will get you there) → Pod Sentinel section.`;
}

export function presentPodSentinelAlert(response: IPendingPodsResponse): void {
  void showErrorMessage('Pod Sentinel Alert', buildAlertMessage(response));
}
