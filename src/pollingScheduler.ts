import {showErrorMessage} from '@jupyterlab/apputils';
import {queryPendingPodsStatus} from './podService';
import {
    getPollingState,
    setIsPolling,
    setPollingTimeoutId,
    stopPolling
} from './pollingManager';
import {PendingPodsResponse} from './types';

async function pollPendingPodsStatus(): Promise<void> {
    const state = getPollingState();

    // Check if polling is enabled before starting
    if (!state.pollingEnabled) {
        console.log('⏸️ Polling disabled - stopping');
        return;
    }

    // Prevent overlapping polls
    if (state.isPolling) {
        console.log('⏸️ Skipping poll - another poll is already taking place');
        scheduleNextPoll();
        return;
    }

    setIsPolling(true);
    console.log('🔄 Checking status of pending pods');

    try {
        const podStatusResponse = await queryPendingPodsStatus<PendingPodsResponse>();
        
        console.log(`📥 Got the following namespace status:`)
        console.log(`🐳 Pending pods count: ${podStatusResponse.pending_pods_count}`);
        console.log(`⏱️ Highest pending duration: ${podStatusResponse.max_pending_duration_seconds}s`);
        console.log(`🚨 Alert triggered: ${podStatusResponse.alert}`);

        // Alert decision logic is in the backend
        if (podStatusResponse.alert) {
            const durationText = podStatusResponse.max_pending_duration_seconds > 0 
                ? ` (longest pending pod: ${Math.round(podStatusResponse.max_pending_duration_seconds)}s)`
                : '';

            void showErrorMessage(
                'Pod Sentinel Alert',
                `⚠️ ${podStatusResponse.pending_pods_count} pod(s) are stuck in pending state${durationText}.
                This usually means your current user / group has exceeded its resource quota. 👉 To resolve this: 1. Stop idle CAI sessions to free up resources. 2. Reduce your resource configuration for the session 3. Contact your administrator for higher resource quotas. You can disable or customize these alerts from JupyterLab Settings Editor (Ctrl + , will get you there) → Pod Sentinel section.`
            );
        }
    } catch (err) {
        console.error('❌ Failed to query pod status:', err);
    } finally {
        setIsPolling(false);
        scheduleNextPoll();
    }
}

function scheduleNextPoll(): void {
    const state = getPollingState();

    // Only schedule the next poll if polling is still enabled
    if (state.pollingEnabled) {
        const timeoutId = setTimeout(() => {
                pollPendingPodsStatus();
            },
            state.pollIntervalSetting);
        setPollingTimeoutId(timeoutId);
    }
}

export function startPolling(): void {
    const state = getPollingState();

    if (!state.pollingEnabled) {
        console.log('🚫 Polling is disabled in settings');
        return;
    }

    console.log('▶️ Starting pod status polling');

    // Clear any existing timeout first
    stopPolling();
    pollPendingPodsStatus();
}