import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './request';

/**
 * Initialization data for the pod-sentinel extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'pod-sentinel:plugin',
  description: 'A JupyterLab extension for Cloudera AI runtime that monitors your Kubernetes namespace for pending pods and alerts you when resource constraints may be blocking your workloads.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension pod-sentinel is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('pod-sentinel settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for pod-sentinel.', reason);
        });
    }

    requestAPI<any>('hello', app.serviceManager.serverSettings)
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The pod_sentinel server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
