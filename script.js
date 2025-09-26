console.log("Seasonality report script loaded");

import { renderVerticalSelection } from "./js/renderVerticalSelection.js";
import { renderUserBehaviorElements } from "./js/renderUserBehaviorElements.js";

// render page-wide vertical selection
renderVerticalSelection();

// render user behavior chart and surrounding elements (filters, legend, etc)
renderUserBehaviorElements();
