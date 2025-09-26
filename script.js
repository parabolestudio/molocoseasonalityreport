console.log("Seasonality report script loaded");

import { renderVerticalSelection } from "./js/renderVerticalSelection.js";
import { renderUserElements } from "./js/renderUserElements.js";
import { renderAdvertiserElements } from "./js/renderAdvertiserElements.js";
import { renderComparisonElements } from "./js/renderComparisonElements.js";

// render page-wide vertical selection
renderVerticalSelection();

// render user behavior chart and surrounding elements (filters, legend, etc)
// renderUserElements();

// render advertiser behavior chart and surrounding elements (filters, legend, etc)
// renderAdvertiserElements();

// render comparison elements (filters, legend, etc)
renderComparisonElements();
