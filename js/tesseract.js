import "./tesseract.css";
import "./uuid.js";
import html from "./tesseract.html";
import { generateUUID } from "./uuid";

//npm install --save tesseract.js
// Note that we will not currently bundle the wasm
import { createWorker } from "tesseract.js";

//npm install pdfjs-dist --save
import * as pdfjsLib from "pdfjs-dist";

async function recognizeTextFromImage(imageUrl) {
  try {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(imageUrl);
    const extractedText = ret.data.text;
    console.log(extractedText);

    await worker.terminate();

    return extractedText;
  } catch (error) {
    console.error("Error recognizing text:", error);
    throw error;
  }
}

function render({ model, el }) {
  function updateOCR(src = "", n = 1) {
    model.set("extracted", "TRYING...");
    model.save_changes();
    if (src) {
      recognizeTextFromImage(src, model.get("lang"))
        .then((text) => {
          //model.set("extracted", text);
          const pagedata = model.get("pagedata");
          const k = "p" + n;
          model.set("pagedata", {
            ...pagedata,
            [k]: text,
            processed: (pagedata.processed || 0) + 1,
          });
          model.set("extracted", text);
          model.save_changes();
          dropzone.innerText = `Processed file...`;

          dropzone.innerText = originalText;
          dropzone.classList.remove("disabled");
        })
        .catch((error) => {
          console.error("Recognition failed:", error);
          model.set("extracted", error);
          model.save_changes();

          dropzone.innerText = originalText;
          dropzone.classList.remove("disabled");
          fileSelectionAllowed = true;
        });
    }
  }

  let el2 = document.createElement("div");
  el2.innerHTML = html;
  const uuid = generateUUID();
  el2.id = uuid;
  el.appendChild(el2);

  const desiredWidth = 1000;
  const dropzone = el.querySelector('div[title="dropzone"]');
  const fileInput = el.querySelector('[name="fileInput"]');
  const imgContainer = el.querySelector(".image-container");
  const originalText = dropzone.innerText;

  dropzone.addEventListener("dragover", handleDragOver);
  dropzone.addEventListener("dragleave", handleDragLeave);
  dropzone.addEventListener("drop", handleDrop);
  dropzone.addEventListener("click", handleClick);

  let fileSelectionAllowed = true;

  async function displayImage(el, imageURL, retain = false) {
    if (!retain) imgContainer.innerHTML = "";
    const imgElement = document.createElement("img");
    imgElement.src = imageURL;
    imgContainer.appendChild(imgElement);
  }

  async function handleDragOver(event) {
    event.preventDefault();
    if (fileSelectionAllowed) {
      dropzone.classList.add("drag-over");
    }
  }

  async function handleDragLeave(event) {
    event.preventDefault();
    if (fileSelectionAllowed) {
      dropzone.classList.remove("drag-over");
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    if (fileSelectionAllowed) {
      dropzone.classList.remove("drag-over");
      const file = event.dataTransfer.files[0];
      fileInput.files = event.dataTransfer.files;
      processFile(file);
    }
  }

  async function handleClick() {
    if (fileSelectionAllowed) {
      fileInput.click();
    }
  }

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    processFile(file);
  });

  async function getFileFromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], url.split("/").pop(), { type: blob.type });
  }

  async function processFile(input) {
    dropzone.classList.add("disabled");
    fileSelectionAllowed = false;
    const history = model.get("history");
    let file = null;
    if (input instanceof File) {
      // Input is a File object from browser upload
      file = input;
    } else {
      file = await getFileFromUrl(input);
    }
    model.set("history", [...history, file.type + ": " + file.name]);
    if (file.type === "application/pdf") {
      const { numPages, imageIterator } = await convertPDFToImages(file);
      dropzone.innerText = `Processing ${numPages} page${
        numPages > 1 ? "s" : ""
      }`;
      let n = 1;
      model.set("pagedata", {
        typ: "pdf",
        pages: numPages,
        name: file.name,
      });
      model.save_changes();

      for await (const { imageURL } of imageIterator) {
        dropzone.classList.add("disabled");
        fileSelectionAllowed = false;
        displayImage(el, imageURL, true);
        dropzone.innerText = `Processing page ${n} of ${numPages}`;
        updateOCR(imageURL, n);
        n = n + 1;
      }

      dropzone.classList.remove("disabled");
      fileSelectionAllowed = true;
    } else {
      model.set("pagedata", {
        typ: file.type,
        pages: 1,
        name: file.name,
      });
      model.save_changes();
      const imageURL = URL.createObjectURL(file);
      displayImage(el, imageURL, false);
      updateOCR(imageURL); //.then((text) => {
      //});
    }
  }

  // How do we bundle this locally?
  // We ned to match version numbers
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs";

  async function convertPDFToImages(file) {
    // returns { numPages, imageIterator }
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

    const numPages = pdf.numPages;
    imgContainer.innerHTML = "";
    async function* images() {
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = desiredWidth;
          canvas.height = (desiredWidth / viewport.width) * viewport.height;
          const renderContext = {
            canvasContext: context,
            viewport: page.getViewport({
              scale: desiredWidth / viewport.width,
            }),
          };
          await page.render(renderContext).promise;
          const imageURL = canvas.toDataURL("image/jpeg", 0.8);
          yield { imageURL };
        } catch (error) {
          console.error(`Error rendering page ${i}:`, error);
        }
      }
    }
    return { numPages: numPages, imageIterator: images() };
  }

  model.on("change:url", () => {
    const url = model.get("url");
    model.set("extracted", "PROCESSING...");
    const history = model.get("history");
    model.set("history", [...history, url]);
    model.set("pagedata", { typ: "url", location: url });
    model.save_changes();
    dropzone.innerText = "Processing file...";
    if (url) {
      displayImage(el, url);
      updateOCR(model.get("url"));
    }
  });

  model.on("change:datauri", () => {
    const datauri = model.get("datauri");
    const datauri_location = model.get("datauri_location");
    model.set("extracted", "PROCESSING...");
    model.set("pagedata", { typ: "datauri", location: datauri_location });

    const history = model.get("history");
    model.set("history", [...history, `datauri::${datauri_location}`]);
    model.save_changes();
    dropzone.innerText = "Processing file...";
    if (datauri) {
      displayImage(el, datauri);
      updateOCR(model.get("datauri"));
    }
  });

  model.on("change:pdf", () => {
    const pdf = model.get("pdf");
    model.set("extracted", "PROCESSING...");
    model.set("pagedata", { typ: `pdf::${pdf}` });
    const history = model.get("history");
    model.set("history", [...history, `datauri::${pdf}`]);
    model.save_changes();
    dropzone.innerText = "Processing file...";
    if (pdf) {
      processFile(pdf);
    }
  });
}

export default { render };
