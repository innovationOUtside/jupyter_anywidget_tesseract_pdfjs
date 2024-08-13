import requests
import base64
from io import BytesIO
from urllib.parse import urlparse
from pathlib import Path

# https://github.com/cdgriffith/puremagic
import puremagic

def image_to_data_uri(image_path_or_url, ret_path=True):

    def typ_from_bytes(bytes):
        content_types_ = puremagic.magic_stream(bytes)
        if content_types_:
            return content_types_[0].mime_type
        else:
            return ""

    image_data = ""
    _src = ""

    # We may pass in _ so we need to persist it
    image_path_or_url = image_path_or_url

    if str(type(image_path_or_url)) == "<class 'IPython.core.display.Image'>":
        image_data = image_path_or_url.data
        content_type = typ_from_bytes(BytesIO(image_data))
        _src = "IPython.core.display.Image"
    elif str(type(image_path_or_url)) == "<class 'matplotlib.axes._axes.Axes'>":
        fig = image_path_or_url.get_figure()
        # Save the figure to a bytes buffer
        buf = BytesIO()
        fig.savefig(buf, format="png")
        buf.seek(0)
        content_type = typ_from_bytes(buf)
        buf.seek(0)
        image_data = buf.getvalue()
        _src = "matplotlib.axes._axes.Axes"
    elif image_path_or_url:
        # Determine if the input is a URL or a local file path
        parsed_url = urlparse(image_path_or_url)
        if parsed_url.scheme in ["http", "https"]:
            response = requests.get(image_path_or_url)
            content_type = response.headers.get("Content-Type", "image/jpeg")
            image_data = response.content
            _src = image_path_or_url
        else:
            # Assume it's a local file path
            path = Path(image_path_or_url)
            if not path.is_file():
                raise FileNotFoundError(
                    f"The file at {image_path_or_url} does not exist."
                )
            with open(path, "rb") as f:
                content_types_ = puremagic.magic_stream(f)
                if content_types_:
                    content_type = content_types_[0].mime_type
                else:
                    return ""
                image_data = f.read()
            _src = image_path_or_url
            if not content_type:
                # Check this is in an allowed list?
                return ""

    # Encode the image data to base64
    if image_data:
        base64_data = base64.b64encode(image_data).decode("utf-8")

        # Create the data URI
        data_uri = f"data:{content_type};base64,{base64_data}"

        if ret_path:
            return data_uri, _src
        else:
            return data_uri

    if ret_path:
        return "", _src

    return ""
