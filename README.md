# pod_sentinel

A JupyterLab extension for Cloudera AI runtime that monitors your Kubernetes namespace for pending pods and alerts you when resource constraints may be blocking your workloads.

This extension is composed of a Python package named `pod_sentinel`
for the server extension and a NPM package named `pod-sentinel`
for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install pod_sentinel
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall pod_sentinel
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

If you would like to contribute to this extension, please refer to the [Contributing Guide](CONTRIBUTING.md).
