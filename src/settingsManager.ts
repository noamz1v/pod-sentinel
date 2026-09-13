import {ISettingRegistry} from '@jupyterlab/settingregistry';
import {PLUGIN_ID, MILLISECONDS_IN_SECOND} from './constants';
import {
    setPollingEnabled,
    setPollingInterval,
    enablePolling,
    disablePolling,
    isPollingEnabled
} from './pollingManager';
import {startPolling} from './pollingScheduler';
import {updateBackendConfig} from './podService';
import {IPodSentinelSettings} from './types';

function readSettings(settings: ISettingRegistry.ISettings, logPrefix: 'Initial' | 'New'): IPodSentinelSettings {
    const pollingEnabled = settings.get('enable_pod_sentinel_polling').composite as boolean;
    const pollIntervalMs = (settings.get('poll_interval').composite as number) * MILLISECONDS_IN_SECOND;
    const gracePeriodSeconds = settings.get('grace_period_seconds').composite as number;
    const maxNotificationsPerPod = settings.get('max_notifications_per_pod').composite as number;

    console.log(`🔧 ${logPrefix} polling setting: ${pollingEnabled ? 'enabled' : 'disabled'}`);
    console.log(`🔧 ${logPrefix} poll interval: ${pollIntervalMs} ms`);
    console.log(`🔧 ${logPrefix} grace period: ${gracePeriodSeconds} seconds`);
    console.log(`🔧 ${logPrefix} max notifications per pod: ${maxNotificationsPerPod}`);

    return {pollingEnabled, pollIntervalMs, gracePeriodSeconds, maxNotificationsPerPod};
}

export async function loadSettings(settingRegistry: ISettingRegistry): Promise<void> {
    try {
        const settings = await settingRegistry.load(PLUGIN_ID);
        const initial = readSettings(settings, 'Initial');

        setPollingEnabled(initial.pollingEnabled);
        setPollingInterval(initial.pollIntervalMs);

        // Sync initial grace period with backend
        console.log('🔁 Syncing initial backend config with settings editor defaults');
        try {
            await updateBackendConfig({
                grace_period_seconds: initial.gracePeriodSeconds,
                max_notifications_per_pod: initial.maxNotificationsPerPod
            });
            console.log('🔧 Backend config synchronized');
        } catch (error) {
            console.error('❌ Failed to sync backend config:', error);
        }

        // Listen for setting changes
        settings.changed.connect(async () => {
            console.log('🔧 Pod sentinel recognized settings changed');
            const updated = readSettings(settings, 'New');

            setPollingInterval(updated.pollIntervalMs);

            // Handle polling enable/disable
            if (updated.pollingEnabled !== isPollingEnabled()) {
                if (updated.pollingEnabled) {
                    enablePolling();
                    startPolling();
                } else {
                    disablePolling();
                }
            }

            console.log('🔁 Syncing new grace period with backend');
            try {
                await updateBackendConfig({
                    grace_period_seconds: updated.gracePeriodSeconds,
                    max_notifications_per_pod: updated.maxNotificationsPerPod
                });
                console.log(`🔧 Backend grace period updated to: ${updated.gracePeriodSeconds} seconds`);
                console.log(`🔧 Backend max notifications per pod updated to: ${updated.maxNotificationsPerPod}`);
            } catch (error) {
                console.error('❌ Failed to update backend configuration:', error);
            }
        });

    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        // Default to enable if settings can't be loaded
        setPollingEnabled(true);
    }
}
