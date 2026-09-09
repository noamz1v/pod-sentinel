import {URLExt} from '@jupyterlab/coreutils';
import {ServerConnection} from '@jupyterlab/services';
import {BackendConfig, BackendConfigResponse} from './types';

export async function queryPendingPodsStatus<T>(
    endPoint = '',
    init: RequestInit = {}
): Promise<T> {
    const serverSettings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        "pod-sentinel/status"
    );

    let response: Response;
    response = await ServerConnection.makeRequest(requestUrl, init, serverSettings);

    if (!response.ok) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message || data.error || data);
    }

    return await response.json();
}

export async function updateBackendConfig(config: Partial<BackendConfig>): Promise<BackendConfigResponse> {
    const serverSettings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        "pod-sentinel/config"
    );

    const init: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    };

    let response: Response;
    response = await ServerConnection.makeRequest(requestUrl, init, serverSettings);

    if (!response.ok) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message || data.error || data);
    }

    return await response.json();
}