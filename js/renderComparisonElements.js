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
import { getDateInUTC } from "./helpers.js";

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

const periods = [
  {
    value: "all",
    title: "Show all",
    subtitle: "October to March",
    icon: "",
    startPast: {
      day: "30",
      month: "9",
      year: "2024",
      week: "40",
      full: "2024-09-30",
    },
    endPast: {
      day: "31",
      month: "3",
      year: "2025",
      week: "14",
      full: "2025-03-31",
    },
    startCurrent: {
      day: "29",
      month: "9",
      year: "2025",
      week: "40",
      full: "2025-09-29",
    },
    endCurrent: {
      day: "30",
      month: "3",
      year: "2026",
      week: "14",
      full: "2026-03-30",
    },
  },
  {
    value: "pre-holiday",
    title: "Pre-holiday",
    subtitle: "October to late November",
    icon: "",
    startPast: {
      day: "30",
      month: "9",
      year: "2024",
      week: "40",
      full: "2024-09-30",
    },
    endPast: {
      day: "25",
      month: "11",
      year: "2024",
      week: "48",
      full: "2024-11-25",
    },
    startCurrent: {
      day: "29",
      month: "9",
      year: "2025",
      week: "40",
      full: "2025-09-29",
    },
    endCurrent: {
      day: "24",
      month: "11",
      year: "2025",
      week: "48",
      full: "2025-11-24",
    },
  },
  {
    value: "peak-season",
    title: "Peak season",
    subtitle: "Late November to December 25",
    icon: "",
    startWeek: "48",
    endWeek: "51",
  },
  {
    value: "post-holiday",
    title: "Post-holiday Q5",
    subtitle: "December 26 to March",
    icon: "",
    startWeek: "52",
    endWeek: "14",
  },
];

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

  const buttons = periods.map((btn) => {
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

// time scales
function getTimeScale(year = "past", period) {
  // year can be "past" or "current"
  // period can be "all", "pre-holiday", "peak-season", "post-holiday"

  const periodObj = periods.find((p) => p.value === period);
  let startY = null;
  let startMonth = null;
  let startDay = null;
  let endY = null;
  let endMonth = null;
  let endDay = null;
  if (periodObj) {
    if (year === "past") {
      startY = periodObj.startPast?.year || null;
      startMonth = periodObj.startPast?.month || null;
      startDay = periodObj.startPast?.day || null;
      endY = periodObj.endPast?.year || null;
      endMonth = periodObj.endPast?.month || null;
      endDay = periodObj.endPast?.day || null;
    } else {
      startY = periodObj.startCurrent?.year || null;
      startMonth = periodObj.startCurrent?.month || null;
      startDay = periodObj.startCurrent?.day || null;
      endY = periodObj.endCurrent?.year || null;
      endMonth = periodObj.endCurrent?.month || null;
      endDay = periodObj.endCurrent?.day || null;
    }
  }

  const start = Date.UTC(startY, startMonth - 1, startDay);
  const end = Date.UTC(endY, endMonth - 1, endDay);
  console.log("getTimeScale:", { year, period, start, end });

  return d3.scaleLinear().domain([start, end]);
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
      setCategory(e.detail.selectedCategory);
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
      setVertical(e.detail.selectedVertical);
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

  // listen to change in year selection
  useEffect(() => {
    const handleYearChange = (e) => setYear(e.detail.selectedYear);
    document.addEventListener("vis-comparison-year-changed", handleYearChange);
    return () => {
      document.removeEventListener(
        "vis-comparison-year-changed",
        handleYearChange
      );
    };
  }, []);

  // listen to change in period selection
  useEffect(() => {
    const handlePeriodChange = (e) => setPeriod(e.detail.selectedPeriod);
    document.addEventListener(
      "vis-comparison-period-changed",
      handlePeriodChange
    );
    return () => {
      document.removeEventListener(
        "vis-comparison-period-changed",
        handlePeriodChange
      );
    };
  }, []);

  // listen to change in user metric selection
  useEffect(() => {
    const handleUserMetricChange = (e) =>
      setUserMetric(e.detail.selectedMetric);
    document.addEventListener(
      "vis-comparison-user-metrics-changed",
      handleUserMetricChange
    );
    return () => {
      document.removeEventListener(
        "vis-comparison-user-metrics-changed",
        handleUserMetricChange
      );
    };
  }, []);
  // listen to change in advertiser metric selection
  useEffect(() => {
    const handleAdvertiserMetricChange = (e) =>
      setAdvertiserMetric(e.detail.selectedMetric);
    document.addEventListener(
      "vis-comparison-advertiser-metrics-changed",
      handleAdvertiserMetricChange
    );
    return () => {
      document.removeEventListener(
        "vis-comparison-advertiser-metrics-changed",
        handleAdvertiserMetricChange
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
  const margin = { top: 50, right: 1, bottom: 60, left: 1 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const months = [
    {
      name: "October",
      begin: "2024-10-01",
      end: "2024-10-31",
      year: "past",
    },
    { name: "November", begin: "2024-11-01", end: "2024-11-30", year: "past" },
    { name: "December", begin: "2024-12-01", end: "2024-12-31", year: "past" },
    { name: "January", begin: "2025-01-01", end: "2025-01-31", year: "past" },
    { name: "February", begin: "2025-02-01", end: "2025-02-28", year: "past" },
    { name: "March", begin: "2025-03-01", end: "2025-03-31", year: "past" },
    {
      name: "October",
      begin: "2025-10-01",
      end: "2025-10-31",
      year: "current",
    },
    {
      name: "November",
      begin: "2025-11-01",
      end: "2025-11-30",
      year: "current",
    },
    {
      name: "December",
      begin: "2025-12-01",
      end: "2025-12-31",
      year: "current",
    },
    {
      name: "January",
      begin: "2026-01-01",
      end: "2026-01-31",
      year: "current",
    },
    {
      name: "February",
      begin: "2026-02-01",
      end: "2026-02-28",
      year: "current",
    },
    { name: "March", begin: "2026-03-01", end: "2026-03-31", year: "current" },
  ];

  // scales
  const timeScale = getTimeScale(year, period).range([0, innerWidth]);

  const displayMonths = months.filter((month) => {
    const monthStart = getDateInUTC(month.begin);
    const monthEnd = getDateInUTC(month.end);
    const periodObj = periods.find((p) => p.value === period);
    if (!periodObj) return false;

    let periodStart = null;
    let periodEnd = null;
    if (year === "past") {
      periodStart = getDateInUTC(periodObj.startPast.full);
      periodEnd = getDateInUTC(periodObj.endPast.full);
    } else {
      periodStart = getDateInUTC(periodObj.startCurrent.full);
      periodEnd = getDateInUTC(periodObj.endCurrent.full);
    }

    return (
      monthEnd >= periodStart && monthStart <= periodEnd && year === month.year
    );
  });

  console.log("Displaying months:", displayMonths);

  return html`<div>
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; border: 1px solid black;"
    >
      <g transform="translate(${margin.left},${margin.top})">
        <rect
          x="0"
          y="0"
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f0f0f0"
        />
        <circle
          cx="${timeScale(getDateInUTC("2024-10-01"))}"
          cy="50"
          r="5"
          fill="red"
        />
        <circle
          cx="${timeScale(getDateInUTC("2024-11-01"))}"
          cy="50"
          r="5"
          fill="orange"
        />
        <circle
          cx="${timeScale(getDateInUTC("2024-12-01"))}"
          cy="50"
          r="5"
          fill="orange"
        />
        <circle
          cx="${timeScale(getDateInUTC("2025-01-01"))}"
          cy="50"
          r="5"
          fill="orange"
        />
        <circle
          cx="${timeScale(getDateInUTC("2025-02-01"))}"
          cy="50"
          r="5"
          fill="orange"
        />
        <circle
          cx="${timeScale(getDateInUTC("2025-03-01"))}"
          cy="50"
          r="5"
          fill="orange"
        />

        <g>
          ${displayMonths.map((month) => {
            const xBegin = timeScale(getDateInUTC(month.begin)) || null;
            const xEnd = timeScale(getDateInUTC(month.end)) || null;
            if (xBegin === null || xEnd === null) return null;
            return html`<g key=${month.name}>
              <rect
                x="${xBegin}"
                y="${innerHeight + 20}"
                width="${xEnd - xBegin}"
                height="33"
                fill="#f0f0f0"
                fill-opacity="0.8"
                rx="10"
                ry="10"
              />
              <text
                x="${(xBegin + xEnd) / 2}"
                y="${innerHeight + 20 + 22}"
                text-anchor="middle"
                class="charts-text-body"
              >
                ${month.name}
              </text>
            </g>`;
          })}
        </g>
      </g>
    </svg>
  </div>`;
}
