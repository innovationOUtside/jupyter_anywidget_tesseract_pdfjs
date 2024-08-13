# jupyter_anywidget_tesseract_pdfjs

Tesseract./ pdf.js [`anywidget`](https://github.com/manzt/anywidget) for previewing PDF and extracting text from PDF, image, etc. in JupyterLab

Inspired by and building on @simonw's (Simon Willison) [OCR tool](https://github.com/simonw/tools/blob/main/ocr.html) [[about](https://simonwillison.net/2024/Mar/30/ocr-pdfs-images/)], use `tesseract.js` in a Jupyter notebook environment via an `anywidget` wrapper.

Using the `anywidget` framework, we can essentially load Javascript and WASM models into a sidebar widget and use the widget for "side-processing" using the browser machinery.

For example, we can use the [`tesseract.js`](https://tesseract.projectnaptha.com/) for OCR/text extraction on images, and [`pdf.js`](https://mozilla.github.io/pdf.js/) for converting PDF documents to images which can then be OCR'd using `tesseract.js`.

This reduces the number of Python dependencies that need to be installed on the host machine, albeit at the expense of loading resources into the browser.

*I'm not much a packaging expert, so some assets are likely to be loaded from a URI; ideally, everything would be bundled into the `anywidget` extension.*

## Installation

`pip install jupyter_anywidget_tesseract_pdfjs`

## Usage

Import the `jupyter_anywidget_tesseract_pdfjs` package and launch a widget:

```python
from jupyter_anywidget_tesseract_pdfjs import tesseract_panel

t = tesseract_panel()
#t = tesseract_panel("example panel title)
#t = tesseract_panel(None, "split-bottom")
```

This loads the widget by default into a new panel using [`jupyterlab_sidecar`](https://github.com/jupyter-widgets/jupyterlab-sidecar).

You can then drag and drop an image file or PDF file onto the landing area or load an image or path in from a notebook code cell.

![Load in widget from code, display in panel](images/widget_loading.png)

| Filetype  | Local file  | Web URL |
|---|---|---|
| Image  | File drag / select; `widget.set_datauri(?)` | `widget.url=?`, `widget.set_url(?)`, `widget.set_datauri(?)` |
|  PDF  |  File drag / select  | `widget.pdf=?`, `widget.set_url(?)`  |
| Image Data URI | `widget.datauri=?` | N/A |
| `matplotlib` axes object | `widget.set_datauri(ax)` | N/A |
| IPython `Image` displayed object | `widget.set_datauri(_)` in next run cell | N/A |

### Accessing extracted text

We can access extracted text via: `t.pagedata`

The results object takes the form:

```python
{'typ': 'pdf',
 'pages': 3,
 'name': 'sample-3pp.pdf',
 'p3': 'elementum. Morbi in ipsum sit ...',
 'processed': 2,
 'p1': "Created for testing ...”, knowing'
}
```

The keys of the form `pN` are page numbers; the `processed` item keeps a count of pages that have been processed; the `pages` item is the total number of pages submutted for processing.

We can also review the extracted text for the last processed image: `t.extracted`

Review a history of files that have been processed: `t.history`

### Examples

*See also the notebooks in `examples`.*

Image at URL:

```python
# Image at URL
image_url = "https://tesseract.projectnaptha.com/img/eng_bw.png"
t.set_datauri(image_url)

#New cell
# We also need to "manually" wait for processing to finish
# before trying to inspect the retrieved data
t.pagedata
```


```python
# Image at URL
image_url = "https://tesseract.projectnaptha.com/img/eng_bw.png"
t.set_url(image_url)
# Also:
# t.set_url(image_url, True) or t.set_url(image_url, force=True)
# Alternatively: t.url = image_url

#New cell
# We also need to "manually" wait for processing to finish
# before trying to inspect the retrieved data
t.pagedata
```

Parse local image file:

```python
# Local image
# Save a URL as a local file
import urllib.request
local_image = 'local_file.png'
urllib.request.urlretrieve(image_url, local_image)

t.set_datauri('') # Force a change in the URI
t.set_datauri(local_image)

# Alternatively, to force the repeated OCR:
# t.set_datauri(local_image, True)
# t.set_datauri(local_image, force=True)

#New cell
# We also need to "manually" wait for processing to finish
# before trying to inspect the retrieved data
t.pagedata
```

Parse online PDF from web URL:

```python
# PDF at URL
pdf_url = "https://pdfobject.com/pdf/sample-3pp.pdf"
t.set_url(pdf_url)
## Alternatively:
# t.pdf = pdf_url
```

Parse IPython `Image` display object:

```python
# Image at URL
from IPython.display import Image
Image(local_image)

#NExt run cell
t.set_datauri(image_url)
```

Parse `matplotlib` axes object:

```python
# matplotlb axes object
import pandas as pd
df = pd.DataFrame({'length': [1.5, 0.5, 1.2, 0.9, 3],
                  'width': [0.7, 0.2, 0.15, 0.2, 1.1]},
                  index=['pig', 'rabbit', 'duck', 'chicken', 'horse'])
ax = df.plot(title="DataFrame Plot")

#New cell
t.set_datauri(ax)
```

View history of OCR lookups:

`t.history`
