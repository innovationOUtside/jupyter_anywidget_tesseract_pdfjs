from IPython.core.magic import Magics, magics_class, line_magic

@magics_class
class TesseractMagic(Magics):
    def __init__(self, shell):
        super(TesseractMagic, self).__init__(shell)

    @line_magic
    def tesseract_magic(self, line):
        items = [s for s in line.strip().split() if s]
        if line:
            w = self.shell.user_ns[items[0]]
            w.set_code_content(items[1])
            # The w.response is the previous state so we can't return it


## %load_ext jupyter_anywidget_pglite
## Usage: %%pglite_magic x [where x is the widget object ]


# TO DO - can we generalise how we set names?

"""
  def set_attribute(self, name, value):
    setattr(self, name, value)
"""
