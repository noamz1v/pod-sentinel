import {ISettingRegistry} from '@jupyterlab/settingregistry';
import {PLUGIN_ID, MILLISECONDS_IN_SECOND} from './constants';
import {
    setPollingEnabled,
    setPollingInterval,
    enablePolling,
    disablePolling,
    getPollingState
} from './pollingManager';
import {startPolling} from './pollingScheduler';
import {updateBackendConfig} from './podService';

export async function loadSettings(settingRegistry: ISettingRegistry): Promise<void> {
    try {
        const settings = await settingRegistry.load(PLUGIN_ID);

        // Get initial setting values
        const enablePollingSetting = settings.get('enable_pod_sentinel_polling').composite as boolean;
        const pollInterval = (settings.get('poll_interval').composite as number) * MILLISECONDS_IN_SECOND;
        const gracePeriod = settings.get('grace_period_seconds').composite as number;
        const maxNotificationsPerPod = settings.get('max_notifications_per_pod').composite as number;

        setPollingEnabled(enablePollingSetting);
        setPollingInterval(pollInterval);
        
        console.log(`🔧 Initial polling setting: ${enablePollingSetting ? 'enabled' : 'disabled'}`);
        console.log(`🔧 Initial poll interval: ${pollInterval} ms`);
        console.log(`🔧 Initial grace period: ${gracePeriod} seconds`);
        console.log(`🔧 Initial max notifications per pod: ${maxNotificationsPerPod}`);

        // Sync initial grace period with backend
        console.log('🔁 Syncing initial backend config with settings editor defaults');
        try {
            await updateBackendConfig({ grace_period_seconds: gracePeriod , max_notifications_per_pod: maxNotificationsPerPod});
            console.log('🔧 Backend config synchronized');
        } catch (error) {
            console.error('❌ Failed to sync backend config:', error);
        }

        // Listen for setting changes
        settings.changed.connect(async () => {
            console.log('🔧 Pod sentinel recognized settings changed');
            const newEnablePolling = settings.get('enable_pod_sentinel_polling').composite as boolean;
            const newPollInterval = (settings.get('poll_interval').composite as number) * MILLISECONDS_IN_SECOND;
            const newGracePeriod = settings.get('grace_period_seconds').composite as number;
            const newMaxNotificationsPerPod = settings.get('max_notifications_per_pod').composite as number;
        
            console.log(`🔧 New polling setting: ${newEnablePolling ? 'enabled' : 'disabled'}`);
            console.log(`🔧 New poll interval: ${newPollInterval} ms`);
            console.log(`🔧 New grace period: ${newGracePeriod} seconds`);
            console.log(`🔧 New max notifications per pod: ${newMaxNotificationsPerPod}`);

            setPollingInterval(newPollInterval);
            const currentState = getPollingState();

            // Handle polling enable/disable
            if (newEnablePolling !== currentState.pollingEnabled) {
                if (newEnablePolling) {
                    enablePolling();
                    startPolling();
                } else {
                    disablePolling();
                }
            }

                console.log('🔁 Syncing new grace period with backend');
            try {
                await updateBackendConfig({ grace_period_seconds: newGracePeriod , max_notifications_per_pod: newMaxNotificationsPerPod});
                console.log(`🔧 Backend grace period updated to: ${newGracePeriod} seconds`);
                console.log(`🔧 Backend max notifications per pod updated to: ${newMaxNotificationsPerPod}`);
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