# BUILD

Notes on setting up and building an `anywidget` package.

## Setup

Create `anywidget` demo widget package:

> `npm create anywidget@latest`

Install packages:

> `npm install`

Test build:

> `npm run build`

Install extra third party packages and add to config file as: `npm install PACKAGE --save`

## Build

Install node packages: `npm install`

Build / package Typescript/JS: `npm run build`

Build Python package (into `dist/`): `hatch build`

Install package: `pip install --upgrade --force-reinstall --no-deps dist/jupyter_anywidget_tesseract_pdfjs-0.0.2-py2.py3-none-any.whl`

Push to PyPi: `twine upload  dist/*0.0.1*` etc.
