import {DEFAULT_POLL_INTERVAL} from './constants';

interface PollingState {
    timeoutId: NodeJS.Timeout | null;
    isPolling: boolean;
    isEnabled: boolean;
    intervalMs: number;
}

// Single source of truth for polling state, private to this module.
const state: PollingState = {
    timeoutId: null,
    isPolling: false,
    isEnabled: true,
    intervalMs: DEFAULT_POLL_INTERVAL
};

export function isPollingEnabled(): boolean {
    return state.isEnabled;
}

export function isCurrentlyPolling(): boolean {
    return state.isPolling;
}

export function getPollInterval(): number {
    return state.intervalMs;
}

export function setPollingEnabled(enabled: boolean): void {
    state.isEnabled = enabled;
}

export function setPollingInterval(interval: number): void {
    state.intervalMs = interval;
}

export function setIsPolling(polling: boolean): void {
    state.isPolling = polling;
}

export function setPollingTimeoutId(timeoutId: NodeJS.Timeout | null): void {
    state.timeoutId = timeoutId;
}

export function stopPolling(): void {
    console.log('⏹️ Stopping pod status polling');
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
    }
    state.isPolling = false;
}

export function enablePolling(): void {
    state.isEnabled = true;
    console.log('✅ Pod sentinel polling enabled');
}

export function disablePolling(): void {
    state.isEnabled = false;
    console.log('🔴 Pod sentinel polling disabled');
    stopPolling();
}
