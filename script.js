console.log("Seasonality report script loaded");

import { renderVerticalSelection } from "./js/renderVerticalSelection.js";
import { renderSeasonalityTimeline } from "./js/renderSeasonalityTimeline.js";
import { renderUserElements } from "./js/renderUserElements.js";
import { renderAdvertiserElements } from "./js/renderAdvertiserElements.js";
import { renderComparisonElements } from "./js/renderComparisonElements.js";
import { fetchGoogleSheetCSV } from "./js/googleSheets.js";

// render page-wide vertical selection
renderVerticalSelection(null);

// render seasonality timeline
renderSeasonalityTimeline();

// render user behavior chart and surrounding elements (filters, legend, etc)
renderUserElements(null, null);

// render advertiser behavior chart and surrounding elements (filters, legend, etc)
renderAdvertiserElements(null, null);

// render comparison elements (filters, legend, etc)
renderComparisonElements(null, null, null);

function handleUserData(inputData) {
  return inputData.forEach((d) => {
    d["country"] = d["country"];
    d["system"] = d["os"];
    d["category"] =
      d["category"].toLowerCase() === "non-gaming"
        ? "consumer"
        : d["category"].toLowerCase();
    d["vertical"] = d["vertical"].toLowerCase().trim();
    d["downloads"] = +d["downloads"];
    d["revenue"] = +d["revenue"];
    d["time_spent"] = +d["time_spent"].trim();
    d["week_start"] = d["week_start_date"];
    d["weekNumber"] = +d["Week Number"].trim();
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
    d["weekNumber"] = +d["Week number"].trim();
  });
}

function handleVerticalData(data) {
  data.forEach((d) => {
    d["vertical"] = d["vertical"].toLowerCase().trim();
    d["system"] = d["os"].trim();
  });
  //add "all" option for all countries and systems
  const allCountries = Array.from(new Set(data.map((d) => d.country)));
  const allSystems = Array.from(new Set(data.map((d) => d.system)));
  allCountries.forEach((country) => {
    allSystems.forEach((system) => {
      data.push({
        country: country,
        system: system,
        vertical: "all",
      });
    });
  });

  return data;
}

Promise.all([
  fetchGoogleSheetCSV("user-engagement-merged"),
  fetchGoogleSheetCSV("advertiser-kpis-merged"),
  fetchGoogleSheetCSV("vertical-inclusion-merged"),
])
  .then(([userDataMerged, advertiserDataMerged, includedVerticalData]) => {
    console.log(
      "Fetched sheet data",
      userDataMerged,
      advertiserDataMerged,
      includedVerticalData
    );
    handleVerticalData(includedVerticalData);

    // create unique list of possible verticals
    const uniqueVerticals = Array.from(
      new Set(includedVerticalData.map((d) => d.vertical))
    );
    renderVerticalSelection(uniqueVerticals);

    handleUserData(userDataMerged);
    renderUserElements(userDataMerged, includedVerticalData);

    handleAdvertiserData(advertiserDataMerged);
    renderAdvertiserElements(advertiserDataMerged, includedVerticalData);

    renderComparisonElements(
      userDataMerged,
      advertiserDataMerged,
      includedVerticalData
    );
  })
  .catch((error) => {
    console.error("Error fetching sheet data:", error);
  });
