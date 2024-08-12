import "./tesseract.css";
import "./uuid.js";
import html from "./tesseract.html";
import { generateUUID } from "./uuid";

//npm install --save tesseract.js
import { createWorker } from "tesseract.js";

async function recognizeTextFromImage(imageUrl) {
  try {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(imageUrl);
    const extractedText = ret.data.text;
    console.log(extractedText);

    // Assuming 'model' is accessible in the scope where this function is called
    if (typeof model !== "undefined") {
      model.set("extracted", extractedText);
      model.save_changes();
    }

    await worker.terminate();

    return extractedText;
  } catch (error) {
    console.error("Error recognizing text:", error);
    throw error;
  }
}

async function displayImage(el, imageURL) {
  const imgContainer = el.querySelector(".image-container");
  imgContainer.innerHTML = "";
  const imgElement = document.createElement("img");
  imgElement.src = imageURL;
  imgContainer.appendChild(imgElement);
}

function render({ model, el }) {
  function updateOCR(src = "") {
    model.set("extracted", "TRYING...");
    model.save_changes();
    if (src) {
      recognizeTextFromImage(src, model.get("lang"))
        .then((text) => {
          model.set("extracted", text);
          model.save_changes();
        })
        .catch((error) => {
          console.error("Recognition failed:", error);
          model.set("extracted", error);
          model.save_changes();
        });
    }
  }

  let el2 = document.createElement("div");
  el2.innerHTML = html;
  const uuid = generateUUID();
  el2.id = uuid;
  el.appendChild(el2);

  const dropzone = document.querySelector('div[title="dropzone"]');
  const fileInput = document.querySelector('[name="fileInput"]');

  dropzone.addEventListener("dragover", handleDragOver);
  dropzone.addEventListener("dragleave", handleDragLeave);
  dropzone.addEventListener("drop", handleDrop);
  dropzone.addEventListener("click", handleClick);

  let fileSelectionAllowed = true;

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

  function processFile(file) {
    dropzone.classList.add("disabled");
    fileSelectionAllowed = false;
    const imageURL = URL.createObjectURL(file);
    displayImage(el, imageURL);
    updateOCR(imageURL);
    dropzone.classList.remove("disabled");
    fileSelectionAllowed = true;
  }

  model.on("change:url", () => {
    model.set("test", model.get("test") + 1);
    model.set("extracted", "WAITING...");
    if (model.get("url")) {
      displayImage(el, model.get("url"));
      updateOCR(model.get("url"));
    }
    model.save_changes();
  });

  model.on("change:datauri", () => {
    model.set("test", model.get("test") + 1);
    model.set("extracted", "WAITING...");
    if (model.get("datauri")) {
      displayImage(el, model.get("datauri"));
      updateOCR(model.get("datauri"));
    }
  });
}

export default { render };
