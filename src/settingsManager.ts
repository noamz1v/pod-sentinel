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

function applyInitialPollingState(settings: IPodSentinelSettings): void {
    setPollingEnabled(settings.pollingEnabled);
    setPollingInterval(settings.pollIntervalMs);
}

function applyPollingStateChange(settings: IPodSentinelSettings): void {
    setPollingInterval(settings.pollIntervalMs);

    if (settings.pollingEnabled === isPollingEnabled()) {
        return;
    }

    if (settings.pollingEnabled) {
        enablePolling();
        startPolling();
    } else {
        disablePolling();
    }
}

async function syncBackendConfig(settings: IPodSentinelSettings): Promise<void> {
    console.log('🔁 Syncing backend config (grace period, max notifications per pod)');
    try {
        await updateBackendConfig({
            grace_period_seconds: settings.gracePeriodSeconds,
            max_notifications_per_pod: settings.maxNotificationsPerPod
        });
        console.log(`🔧 Backend config synchronized: grace period ${settings.gracePeriodSeconds}s, max notifications per pod ${settings.maxNotificationsPerPod}`);
    } catch (error) {
        console.error('❌ Failed to sync backend config:', error);
    }
}

function watchSettingsChanges(settings: ISettingRegistry.ISettings): void {
    settings.changed.connect(async () => {
        console.log('🔧 Pod sentinel recognized settings changed');
        const updated = readSettings(settings, 'New');

        applyPollingStateChange(updated);
        await syncBackendConfig(updated);
    });
}

export async function loadSettings(settingRegistry: ISettingRegistry): Promise<void> {
    try {
        const settings = await settingRegistry.load(PLUGIN_ID);
        const initial = readSettings(settings, 'Initial');

        applyInitialPollingState(initial);
        await syncBackendConfig(initial);
        watchSettingsChanges(settings);
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        // Default to enable if settings can't be loaded
        setPollingEnabled(true);
    }
}
