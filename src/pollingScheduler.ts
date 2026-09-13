// Drives the recurring poll loop: on each tick, fetches pod status from the
// backend and hands off to alertPresenter when an alert is due.
import {queryPendingPodsStatus} from './podService';
import {presentPodSentinelAlert} from './alertPresenter';
import {
    isPollingEnabled,
    isCurrentlyPolling,
    getPollInterval,
    setIsPolling,
    setPollingTimeoutId,
    stopPolling
} from './pollingManager';
import {IPendingPodsResponse} from './types';

function logPollResult(response: IPendingPodsResponse): void {
    console.log('📥 Got the following namespace status:');
    console.log(`🐳 Pending pods count: ${response.pending_pods_count}`);
    console.log(`⏱️ Highest pending duration: ${response.max_pending_duration_seconds}s`);
    console.log(`🚨 Alert triggered: ${response.alert}`);
}

// Decides whether a poll should run right now, handling the side effects
// (logging, rescheduling) specific to each reason it might not.
function shouldRunPoll(): boolean {
    if (!isPollingEnabled()) {
        console.log('⏸️ Polling disabled - stopping');
        return false;
    }

    // Prevent overlapping polls
    if (isCurrentlyPolling()) {
        console.log('⏸️ Skipping poll - another poll is already taking place');
        scheduleNextPoll();
        return false;
    }

    return true;
}

async function fetchAndReportStatus(): Promise<void> {
    const podStatusResponse = await queryPendingPodsStatus();
    logPollResult(podStatusResponse);

    // Alert decision logic is in the backend
    if (podStatusResponse.alert) {
        presentPodSentinelAlert(podStatusResponse);
    }
}

async function pollPendingPodsStatus(): Promise<void> {
    if (!shouldRunPoll()) {
        return;
    }

    setIsPolling(true);
    console.log('🔄 Checking status of pending pods');

    try {
        await fetchAndReportStatus();
    } catch (err) {
        console.error('❌ Failed to query pod status:', err);
    } finally {
        setIsPolling(false);
        scheduleNextPoll();
    }
}

function scheduleNextPoll(): void {
    // Only schedule the next poll if polling is still enabled
    if (isPollingEnabled()) {
        const timeoutId = setTimeout(() => pollPendingPodsStatus(), getPollInterval());
        setPollingTimeoutId(timeoutId);
    }
}

export function startPolling(): void {
    if (!isPollingEnabled()) {
        console.log('🚫 Polling is disabled in settings');
        return;
    }

    console.log('▶️ Starting pod status polling');

    // Clear any existing timeout first
    stopPolling();
    pollPendingPodsStatus();
}
