import { fetchGoogleSheetCSV } from "./googleSheets.js";
import {
  populateCountrySelector,
  populateSystemSelector,
  getDropdownValue,
} from "./populateSelector.js";
import {
  html,
  renderComponent,
  useState,
  useEffect,
} from "./utils/preact-htm.js";
import { valueFormatting } from "./helpers.js";

export function renderComparisonElements() {
  console.log("Rendering comparison elements");

  // populate system selector
  populateSystemSelector("vis-comparison-dropdown-systems");

  // render metrics buttons
  renderMetricsButtons(
    userMetrics,
    userMetricDefault,
    "vis-comparison-user-metrics"
  );
  renderMetricsButtons(
    advertiserMetrics,
    advertiserMetricDefault,
    "vis-comparison-advertiser-metrics"
  );

  // fetch data from google sheet
  //   fetchGoogleSheetCSV("user-engagement")
  //     .then((data) => {
  //       // format data
  //       handleData(data);

  //       // populate country selector
  //       const countries = Array.from(
  //         new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
  //       ).sort();
  //       populateCountrySelector(countries, "vis-user-dropdown-countries");

  //       // render chart with data
  //       renderUserChart(data);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching sheet data (user engagement):", error);
  //     });

  //   function handleData(data) {
  //     return data.forEach((d) => {
  //       d["country"] = d["country"];
  //       d["system"] = d["os"];
  //       d["category"] =
  //         d["category"].toLowerCase() === "non-gaming"
  //           ? "consumer"
  //           : d["category"].toLowerCase();
  //       d["vertical"] = d["vertical"].toLowerCase().trim();
  //       d["wau"] = +d["median_wau"];
  //       d["downloads"] = +d["total_downloads"];
  //       d["revenue"] = +d["total_revenue"];
  //       d["time_spent"] = +d["total_time_spent"].trim();
  //       d["week_start"] = d["week_start_date"];
  //     });
  //   }
}

const userMetrics = [
  { value: "median_wau", label: "WAU" },
  { value: "total_downloads", label: "Downloads" },
  { value: "total_revenue", label: "Revenue" },
  { value: "total_time_spent", label: "Time Spent" },
];
const userMetricDefault = userMetrics[0];

const advertiserMetrics = [
  { value: "bids_p50", label: "Bid Requests" },
  { value: "cpm_p50", label: "CPM" },
  { value: "cpi_p50", label: "CPI" },
  { value: "roas_d7_p50", label: "ROAS" },
  { value: "arppu_d7_p50", label: "ARRPU" },
];
const advertiserMetricDefault = advertiserMetrics[0];

function renderMetricsButtons(metrics, metricDefault, containerId) {
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${ComparisonMetricsButtons}
        metrics=${metrics}
        metricDefault=${metricDefault}
        containerId=${containerId}
      />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function ComparisonMetricsButtons({ metrics, metricDefault, containerId }) {
  const [selectedMetric, setSelectedMetric] = useState(metricDefault.value);

  return html`<div class="vis-metrics-buttons-container">
    ${metrics.map(
      (metric) =>
        html`<button
          class="vis-metrics-button ${selectedMetric === metric.value
            ? "selected"
            : ""}"
          onclick=${() => {
            setSelectedMetric(metric.value);
            // Dispatch custom event to notify other components
            document.dispatchEvent(
              new CustomEvent(`${containerId}-changed`, {
                detail: { selectedMetric: metric.value },
              })
            );
          }}
        >
          ${metric.label}
        </button>`
    )}
  </div>`;
}
