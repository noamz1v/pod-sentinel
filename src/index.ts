import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { PLUGIN_ID } from './constants';
import { loadSettings } from './settingsManager';
import { startPolling } from './pollingScheduler';
import { stopPolling, isPollingEnabled } from './pollingManager';

// Ensure that polling is stopped when the app is closed
function stopPollingOnUnload(app: JupyterFrontEnd): void {
  app.restored.then(() => {
    window.addEventListener('beforeunload', () => {
      stopPolling();
    });
  });
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'A JupyterLab extension for Cloudera AI runtime that monitors your Kubernetes namespace for pending pods and alerts you when resource constraints may be blocking your workloads.',
  autoStart: true,
  requires: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    console.log('✅ Pod Sentinel extension activated');

    await loadSettings(settingRegistry);

    if (isPollingEnabled()) {
      startPolling();
    }

    stopPollingOnUnload(app);
  }
};

export default plugin;
