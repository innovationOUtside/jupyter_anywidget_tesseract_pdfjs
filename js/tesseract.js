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

  model.on("change:url", () => {
    model.set("test", model.get("test") + 1);
    model.set("extracted", "WAITING...");
    if (model.get("url")) {
      updateOCR(model.get("url"));
    }
    model.save_changes();
  });

  model.on("change:datauri", () => {
    model.set("test", model.get("test") + 1);
    model.set("extracted", "WAITING...");
    if (model.get("datauri")) {
      updateOCR(model.get("datauri"));
    }
  });
  model.save_changes();
}

export default { render };
