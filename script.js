console.log("Seasonality report script loaded");

import { renderVerticalSelection } from "./js/renderVerticalSelection.js";
import { renderUserElements } from "./js/renderUserElements.js";
import { renderAdvertiserElements } from "./js/renderAdvertiserElements.js";
import { renderComparisonElements } from "./js/renderComparisonElements.js";
import { fetchGoogleSheetCSV } from "./js/googleSheets.js";

// render user behavior chart and surrounding elements (filters, legend, etc)
renderUserElements(null);

// fetch user data from google sheet
fetchGoogleSheetCSV("user-engagement")
  .then((data) => {
    // render chart with data
    renderUserElements(data);
  })
  .catch((error) => {
    console.error("Error fetching sheet data (user engagement):", error);
  });

// render page-wide vertical selection
renderVerticalSelection();

// render advertiser behavior chart and surrounding elements (filters, legend, etc)
renderAdvertiserElements();

// render comparison elements (filters, legend, etc)
renderComparisonElements();
