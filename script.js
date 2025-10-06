console.log("Seasonality report script loaded");

import { renderVerticalSelection } from "./js/renderVerticalSelection.js";
import { renderSeasonalityTimeline } from "./js/renderSeasonalityTimeline.js";
import { renderUserElements } from "./js/renderUserElements.js";
import { renderAdvertiserElements } from "./js/renderAdvertiserElements.js";
import { renderComparisonElements } from "./js/renderComparisonElements.js";
import { fetchGoogleSheetCSV } from "./js/googleSheets.js";

// render page-wide vertical selection
renderVerticalSelection();

// render seasonality timeline
renderSeasonalityTimeline();

// render user behavior chart and surrounding elements (filters, legend, etc)
renderUserElements(null);

// render advertiser behavior chart and surrounding elements (filters, legend, etc)
renderAdvertiserElements(null);

// render comparison elements (filters, legend, etc)
renderComparisonElements(null, null);

function handleUserData(inputData) {
  return inputData.forEach((d) => {
    d["country"] = d["country"];
    d["system"] = d["os"];
    d["category"] =
      d["category"].toLowerCase() === "non-gaming"
        ? "consumer"
        : d["category"].toLowerCase();
    d["vertical"] = d["vertical"].toLowerCase().trim();
    // d["wau"] = +d["median_wau"];
    d["downloads"] = +d["downloads"];
    d["revenue"] = +d["revenue"];
    d["time_spent"] = +d["time_spent"].trim();
    // d["downloads"] = +d["total_downloads"];
    // d["revenue"] = +d["total_revenue"];
    // d["time_spent"] = +d["total_time_spent"].trim();
    d["week_start"] = d["week_start_date"];
    d["weekNumber"] = +d["Week number"].trim();
  });
}

function handleAdvertiserData(data) {
  return data.forEach((d) => {
    d["country"] = d["country"];
    d["system"] = d["os"];

    d["category"] =
      d["category"].toLowerCase() === "non-gaming"
        ? "consumer"
        : d["category"].toLowerCase();
    if (
      d["vertical"].toLowerCase().trim() === "all" ||
      d["vertical"].toLowerCase().trim() === "consumer-all" ||
      d["vertical"].toLowerCase().trim() === "gaming-all"
    ) {
      d["vertical"] = "all";
    } else {
      d["vertical"] = d["vertical"].toLowerCase().trim();
    }

    d["week_start"] = d["week_start_date"];
    d["weekNumber"] = +d["Week Number"].trim();
  });
}

// Promise.all([
//   fetchGoogleSheetCSV("user-engagement"),
//   fetchGoogleSheetCSV("advertiser-kpis"),
// ])
//   .then(([userData, advertiserData]) => {
//     console.log("Fetched sheet data", userData, advertiserData);
//     handleUserData(userData);
//     renderUserElements(userData);

//     handleAdvertiserData(advertiserData);
//     renderAdvertiserElements(advertiserData);
//     renderComparisonElements(userData, advertiserData);
//   })
//   .catch((error) => {
//     console.error("Error fetching sheet data:", error);
//   });
