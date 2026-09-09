from ._version import __version__
from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "pod-sentinel"
    }]


def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata describing
    where to find the extension's server extension implementation
    """
    return [{"module": "pod_sentinel"}]


# Called when the extension is loaded.
def _load_jupyter_server_extension(server_app):
    setup_handlers(server_app)


# For older jupyter_server versions compatibility
load_jupyter_server_extension = _load_jupyter_server_extension