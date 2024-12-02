import importlib.metadata
import pathlib

import anywidget
import traitlets
import time

from .utils import image_to_data_uri

try:
    __version__ = importlib.metadata.version("jupyter_anywidget_tesseract_pdfjs")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

import warnings
try:
    from jupyter_ui_poll import ui_events
except:
    warnings.warn(
        "You must install jupyter_ui_poll if you want to return cell responses / blocking waits (not JupyerLite); install necessary packages then restart the notebook kernel:%pip install jupyter_ui_poll",
        UserWarning,
    )

class Widget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"
    value = traitlets.Int(0).tag(sync=True)


class tesseractPdfjsWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "tesseract.js"
    _css = pathlib.Path(__file__).parent / "static" / "tesseract.css"

    # test = traitlets.Int(0).tag(sync=True)
    headless = traitlets.Bool(False).tag(sync=True)
    url = traitlets.Unicode("").tag(sync=True)
    pdf = traitlets.Unicode("").tag(sync=True)
    test_url = traitlets.Unicode(
        "https://tesseract.projectnaptha.com/img/eng_bw.png"
    ).tag(
        sync=True
    )  # TO DO - should be read only
    # b64 = traitlets.Bytes(b"").tag(sync=True)
    datauri = traitlets.Unicode("").tag(sync=True)
    datauri_location = traitlets.Unicode("").tag(sync=True)
    lang = traitlets.Unicode("eng").tag(sync=True)
    extracted = traitlets.Unicode("").tag(sync=True)
    pagedata = traitlets.Dict().tag(sync=True)
    history = traitlets.List([]).tag(sync=True)
    response = traitlets.Dict().tag(sync=True)

    def __init__(self, headless=False,  **kwargs):
        super().__init__(**kwargs)
        self.headless = headless
        self.response = {"status": "initialising"}

    def _wait(self, timeout, conditions=("status", "completed")):
        start_time = time.time()
        with ui_events() as ui_poll:
            while self.response[conditions[0]] != conditions[1]:
                ui_poll(10)
                if timeout and ((time.time() - start_time) > timeout):
                    raise TimeoutError(
                        "Action not completed within the specified timeout."
                    )
                time.sleep(0.1)
        self.response["time"] = time.time() - start_time
        return

    def ready(self, timeout=5):
        self._wait(timeout, ("status", "ready"))

    def set_url(self, value, force=False):
        # HACKY - need a better pdf detect
        if value.split(".")[-1].lower() == "pdf":
            if force and value:
                self.pdf = ""
            self.pdf = value
        else:
            if force and value:
                self.url = ""
            self.url = value

    def from_url(self, value, force=False, timeout=None):
        # HACKY - need a better pdf detect
        self.response = {"status": "processing"}
        if value.split(".")[-1].lower() == "pdf":
            if force and value:
                self.pdf = ""
            self.pdf = value
        else:
            if force and value:
                self.url = ""
            self.url = value
        self._wait(timeout)
        return self.pagedata

    def set_datauri(self, path, force=False):
        datauri, datauri_location = image_to_data_uri(path)
        self.datauri_location = datauri_location
        if force and path:
            self.datauri = ""
        self.datauri = datauri

def tesseract_headless():
    widget_ = tesseractPdfjsWidget(headless=True)
    display(widget_)
    return widget_

from .magics import TesseractMagic


def load_ipython_extension(ipython):
    ipython.register_magics(TesseractMagic)


from functools import wraps
from sidecar import Sidecar
from IPython.display import display


# Create a decorator to simplify panel autolaunch
# First parameter on decorated function is optional title
# Second parameter on decorated function is optional anchor location
# Via Claude.ai
def create_panel(widget_class):
    @wraps(widget_class)
    def wrapper(title=None, anchor="split-right"):
        if title is None:
            title = f"{widget_class.__name__[:-6]} Output"  # Assuming widget classes end with 'Widget'

        widget_ = widget_class()
        widget_.sc = Sidecar(title=title, anchor=anchor)

        with widget_.sc:
            display(widget_)

        # Add a close method to the widget
        def close():
            widget_.sc.close()

        widget_.close = close

        return widget_
        # We can then close the panel as sc.

    return wrapper


# Launch with custom title as: pglite_panel("PGlite")
# Use second parameter for anchor
@create_panel
def tesseract_panel(title=None, anchor=None):
    return tesseractPdfjsWidget()


def tesseract_inline():
    widget_ = tesseractPdfjsWidget()
    display(widget_)
    return widget_
