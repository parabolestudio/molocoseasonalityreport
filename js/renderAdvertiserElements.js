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

export function renderAdvertiserElements() {
  console.log("Rendering advertiser elements");

  // populate system selector
  populateSystemSelector("vis-advertiser-dropdown-systems");

  // render metrics buttons
  renderMetricsButtons();

  // fetch data from google sheet
  fetchGoogleSheetCSV("advertiser-kpis")
    .then((data) => {
      // format data
      handleData(data);

      // populate country selector
      const countries = Array.from(
        new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
      ).sort();
      populateCountrySelector(countries, "vis-advertiser-dropdown-countries");

      // render chart with data
      renderAdvertiserChart(data);
    })
    .catch((error) => {
      console.error("Error fetching sheet data (advertiser KPIs):", error);
    });

  function handleData(data) {
    return data.forEach((d) => {
      d["country"] = d["country"];
      d["system"] = d["os"];
      d["category"] = d["category"];
      d["vertical"] = d["vertical"];
      d["week_start"] = d["week_start_date"];
      d["roas"] = +d["roas_d7_p50"];
    });
  }
}

function renderMetricsButtons() {
  const containerId = "vis-advertiser-metrics";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${AdvertiserMetricsButtons} />`, containerElement);
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

const metrics = [
  { value: "bids_p50", label: "Bid Requests" },
  { value: "cpm_p50", label: "CPM" },
  { value: "cpi_p50", label: "CPI" },
  { value: "roas_d7_p50", label: "ROAS" },
  { value: "arppu_d7_p50", label: "ARRPU" },
];
const metricDefault = metrics[0];

function AdvertiserMetricsButtons() {
  const [selectedMetric, setSelectedMetric] = useState(metricDefault.value);

  return html`<div class="vis-metrics-buttons-container">
    ${metrics.map(
      (metric) =>
        html`<button
          class="vis-metrics-button ${selectedMetric === metric.value
            ? "selected"
            : ""}"
          data-metric="${metric.value}"
          onclick=${() => {
            setSelectedMetric(metric.value);
            // Dispatch custom event to notify other components
            document.dispatchEvent(
              new CustomEvent("vis-advertiser-metrics-changed", {
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

function renderAdvertiserChart(data) {
  const containerId = "vis-advertiser-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${AdvertiserChart} data=${data} />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function AdvertiserChart({ data }) {
  const [system, setSystem] = useState(
    getDropdownValue("vis-advertiser-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-advertiser-dropdown-countries")
  );
  const [metric, setMetric] = useState(metricDefault.value);
  const [chartData, setChartData] = useState(filterData(data));

  function filterData(inputData) {
    return inputData.filter(
      (d) => d.system === system && d.country === country
    );
  }
  useEffect(() => {
    setChartData(filterData(data));
  }, [system, country]);

  // listen to change in advertiser system dropdown
  useEffect(() => {
    const handleSystemChange = (e) => setSystem(e.detail.selectedSystem);
    document.addEventListener(
      "vis-advertiser-dropdown-systems-changed",
      handleSystemChange
    );
    return () => {
      document.removeEventListener(
        "vis-advertiser-dropdown-systems-changed",
        handleSystemChange
      );
    };
  }, []);

  // listen to change in advertiser country dropdown
  useEffect(() => {
    const handleCountryChange = (e) => setCountry(e.detail.selectedCountry);
    document.addEventListener(
      "vis-advertiser-dropdown-countries-changed",
      handleCountryChange
    );
    return () => {
      document.removeEventListener(
        "vis-advertiser-dropdown-countries-changed",
        handleCountryChange
      );
    };
  }, []);

  // listen to change in advertiser metrics buttons
  useEffect(() => {
    const handleMetricsChange = (e) => setMetric(e.detail.selectedMetric);
    document.addEventListener(
      "vis-advertiser-metrics-changed",
      handleMetricsChange
    );
    return () => {
      document.removeEventListener(
        "vis-advertiser-metrics-changed",
        handleMetricsChange
      );
    };
  }, []);

  console.log("Rendering advertiser chart with data:", chartData);

  // set up vis dimensions

  const visContainer = document.querySelector(`#vis-advertiser-container`);
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height = 600;
  const margin = { top: 20, right: 1, bottom: 20, left: 1 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return html`<div>
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; background-color: #f1f1f1"
    >
      <g transform="translate(${margin.left},${margin.top})">
        <rect
          x="0"
          y="0"
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f0f0f0"
        />
      </g>
    </svg>
  </div>`;
}
