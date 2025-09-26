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

  // render year buttons
  renderYearButtons();

  // render period buttons
  renderPeriodButtons();

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
  renderComparisonChart([]);
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

function renderYearButtons() {
  const containerId = "vis-comparison-years";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${ComparisonYearButtons} />`, containerElement);
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function ComparisonYearButtons() {
  const [selectedYear, setSelectedYear] = useState("past");

  const handleYearChange = (year) => {
    setSelectedYear(year);
    // Dispatch custom event to notify other components
    document.dispatchEvent(
      new CustomEvent(`vis-comparison-year-changed`, {
        detail: { selectedYear: year },
      })
    );
  };

  return html`<div class="vis-year-buttons-container">
    <button
      class="vis-year-button ${selectedYear === "past" ? "selected" : ""}"
      onclick=${() => handleYearChange("past")}
    >
      Past (2024/2025)
    </button>
    <button
      class="vis-year-button ${selectedYear === "current" ? "selected" : ""}"
      onclick=${() => handleYearChange("current")}
    >
      Current (2025/2026)
    </button>
  </div>`;
}

function renderPeriodButtons() {
  const containerId = "vis-comparison-periods";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${ComparisonPeriodButtons} />`, containerElement);
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function ComparisonPeriodButtons() {
  const [selectedPeriod, setSelectedPeriod] = useState("pre-holiday");

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // Dispatch custom event to notify other components
    document.dispatchEvent(
      new CustomEvent(`vis-comparison-period-changed`, {
        detail: { selectedPeriod: period },
      })
    );
  };

  const buttonContent = [
    {
      value: "all",
      title: "Show all",
      subtitle: "October to March",
      icon: "",
    },
    {
      value: "pre-holiday",
      title: "Pre-holiday",
      subtitle: "October to late November",
      icon: "",
    },
    {
      value: "peak-season",
      title: "Peak season",
      subtitle: "Late November to December 25",
      icon: "",
    },
    {
      value: "post-holiday",
      title: "Post-holiday Q5",
      subtitle: "December 26 to March",
      icon: "",
    },
  ];

  const buttons = buttonContent.map((btn) => {
    return html`<div
      class="vis-period-button ${selectedPeriod === btn.value
        ? "selected"
        : ""}"
      onclick=${() => handlePeriodChange(btn.value)}
    >
      <div class="vis-period-button-text">
        <span class="vis-period-title">${btn.title}</span>
        <span class="vis-period-subtitle">${btn.subtitle}</span>
      </div>
    </div>`;
  });

  return html`<div class="vis-period-buttons-container">${buttons}</div>`;
}

function renderComparisonChart(data) {
  const containerId = "vis-comparison-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${ComparisonChart} data=${data} />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function ComparisonChart({ data }) {
  const [system, setSystem] = useState(
    getDropdownValue("vis-comparison-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-comparison-dropdown-countries")
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [year, setYear] = useState("past");
  const [period, setPeriod] = useState("pre-holiday");
  const [userMetric, setUserMetric] = useState(userMetricDefault.value);
  const [advertiserMetric, setAdvertiserMetric] = useState(
    advertiserMetricDefault.value
  );

  const [chartData, setChartData] = useState(filterData(data));

  function filterData(inputData) {
    return inputData.filter(
      (d) =>
        d.system === system &&
        d.country === country &&
        d.category === category &&
        d.vertical === vertical
    );
  }
  useEffect(() => {
    setChartData(filterData(data));
  }, [system, country, category, vertical]);

  // TODO: add listeners for year, period, userMetric, advertiserMetric

  // listen to change in comparison system dropdown
  useEffect(() => {
    const handleSystemChange = (e) => setSystem(e.detail.selectedSystem);
    document.addEventListener(
      "vis-comparison-dropdown-systems-changed",
      handleSystemChange
    );
    return () => {
      document.removeEventListener(
        "vis-comparison-dropdown-systems-changed",
        handleSystemChange
      );
    };
  }, []);

  // listen to change in comparison country dropdown
  useEffect(() => {
    const handleCountryChange = (e) => setCountry(e.detail.selectedCountry);
    document.addEventListener(
      "vis-comparison-dropdown-countries-changed",
      handleCountryChange
    );
    return () => {
      document.removeEventListener(
        "vis-comparison-dropdown-countries-changed",
        handleCountryChange
      );
    };
  }, []);

  // listen to change in general category
  useEffect(() => {
    const handleCategoryChange = (e) => {
      const selectedCategory = e.detail.selectedCategory;
      setCategory(selectedCategory);
    };
    document.addEventListener(
      "vis-vertical-filter-category-changed",
      handleCategoryChange
    );
    return () => {
      document.removeEventListener(
        "vis-vertical-filter-category-changed",
        handleCategoryChange
      );
    };
  }, []);

  // listen to change in general vertical
  useEffect(() => {
    const handleVerticalChange = (e) => {
      const selectedVertical = e.detail.selectedVertical;
      setVertical(selectedVertical);
    };
    document.addEventListener(
      "vis-vertical-filter-vertical-changed",
      handleVerticalChange
    );
    return () => {
      document.removeEventListener(
        "vis-vertical-filter-vertical-changed",
        handleVerticalChange
      );
    };
  }, []);

  console.log(
    "Rendering comparison chart",
    chartData,
    system,
    country,
    category,
    vertical,
    year,
    period,
    userMetric,
    advertiserMetric
  );

  // set up vis dimensions
  const visContainer = document.querySelector(`#vis-comparison-container`);
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
