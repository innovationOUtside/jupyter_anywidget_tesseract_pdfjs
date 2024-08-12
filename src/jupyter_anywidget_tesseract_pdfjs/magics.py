from IPython.core.magic import Magics, magics_class, cell_magic


@magics_class
class TesseractMagic(Magics):
    def __init__(self, shell):
        super(TesseractMagic, self).__init__(shell)

    @cell_magic
    def tesseract_magic(self, line, cell):
        obj_name = line.strip()
        if cell:
            w = self.shell.user_ns[obj_name]
            w.set_code_content(cell)
            # The w.response is the previous state so we can't return it


## %load_ext jupyter_anywidget_pglite
## Usage: %%pglite_magic x [where x is the widget object ]


# TO DO - can we generalise how we set names?

"""
  def set_attribute(self, name, value):
    setattr(self, name, value)
"""
