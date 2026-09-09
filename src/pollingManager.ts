import {DEFAULT_POLL_INTERVAL} from './constants';

// Global polling control
let pollingTimeoutId: NodeJS.Timeout | null = null;
let isPolling = false;
let pollingEnabled = true;
let pollIntervalSetting: number = DEFAULT_POLL_INTERVAL;

export function getPollingState() {
    return {
        pollingTimeoutId,
        isPolling,
        pollingEnabled,
        pollIntervalSetting
    };
}

export function setPollingEnabled(enabled: boolean): void {
    pollingEnabled = enabled;
}

export function setPollingInterval(interval: number): void {
    pollIntervalSetting = interval;
}

export function setIsPolling(polling: boolean): void {
    isPolling = polling;
}

export function setPollingTimeoutId(timeoutId: NodeJS.Timeout | null): void {
    pollingTimeoutId = timeoutId;
}

export function stopPolling(): void {
    console.log('⏹️ Stopping pod status polling');
    if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
        pollingTimeoutId = null;
    }
    isPolling = false;
}

export function enablePolling(): void {
    pollingEnabled = true;
    console.log('✅ Pod sentinel polling enabled');
}

export function disablePolling(): void {
    pollingEnabled = false;
    console.log('🔴 Pod sentinel polling disabled');
    stopPolling();
}