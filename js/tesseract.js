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
  let el2 = document.createElement("div");
  el2.innerHTML = html;
  const uuid = generateUUID();
  el2.id = uuid;
  el.appendChild(el2);

  model.on("change:url", () => {
    model.set("test", model.get("test")+1)
    model.set("extracted", "WAITING...");
    //"https://tesseract.projectnaptha.com/img/eng_bw.png"
    if (model.get("url")) {
        model.set("extracted", "TTRYING...");
      recognizeTextFromImage(model.get("url"))
        .then((text) => {
          model.set("extracted", text);
          model.save_changes();
        })
        .catch((error) => {
            model.set("extracted", "ERROR"+error);
            model.save_changes();
        });
    }

  });
}

export default { render };
