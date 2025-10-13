import { fetchGoogleSheetCSV } from "./googleSheets.js";
import { html, renderComponent } from "./utils/preact-htm.js";
import { formatDate } from "./helpers.js";

const containerId = "vis-text-last-data-update";
export default function renderLatestDataUpdate() {
  console.log("Rendering latest data update...");

  fetchGoogleSheetCSV("latest-data-update")
    .then((data) => {
      console.log("Latest data update", data);

      if (data.length === 0) {
        console.warn("No data found in latest-data-update sheet.");
        return;
      }
      const date = data[0]["date"];
      if (!date) {
        console.warn("No date found in the latest-data-update sheet.");
        return;
      }

      let containerElement = document.querySelector(`#${containerId}`);

      if (containerElement) {
        containerElement.innerHTML = "";
        renderComponent(
          html`<span>${formatDate(date)}</span>`,
          containerElement
        );
      } else {
        console.error(
          `Could not find container element for vertical selection with id ${containerId}`
        );
      }
    })
    .catch((error) => {
      console.error("Error fetching sheet data (last updated date):", error);
    });
}
