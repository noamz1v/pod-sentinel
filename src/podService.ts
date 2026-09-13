// HTTP client for the pod-sentinel backend API (see pod_sentinel/handlers.py):
// reads pending-pod status and pushes settings-derived config to it.
import {URLExt} from '@jupyterlab/coreutils';
import {ServerConnection} from '@jupyterlab/services';
import {IBackendConfig, IBackendConfigResponse, IPendingPodsResponse} from './types';

async function requestPodSentinelApi<T>(
    endpoint: string,
    init: RequestInit = {}
): Promise<T> {
    const serverSettings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'pod-sentinel',
        endpoint
    );

    const response = await ServerConnection.makeRequest(requestUrl, init, serverSettings);

    if (!response.ok) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message || data.error || data);
    }

    return await response.json();
}

export async function queryPendingPodsStatus(): Promise<IPendingPodsResponse> {
    return requestPodSentinelApi<IPendingPodsResponse>('status');
}

export async function updateBackendConfig(config: Partial<IBackendConfig>): Promise<IBackendConfigResponse> {
    return requestPodSentinelApi<IBackendConfigResponse>('config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    });
}
