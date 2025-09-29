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
import { getDateInUTC, ASSETS_URL } from "./helpers.js";
import { holidays } from "./holidays.js";
import TooltipHoliday from "./TooltipHoliday.js";

export function renderComparisonElements(userData, advertiserData) {
  console.log("Rendering comparison elements", userData, advertiserData);

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

  populateCountrySelector(["USA"], "vis-comparison-dropdown-countries");

  if (
    userData &&
    userData.length > 0 &&
    advertiserData &&
    advertiserData.length > 0
  ) {
    // format data
    handleUserData(userData);
    handleAdvertiserData(advertiserData);

    // populate country selector
    const countries = Array.from(
      new Set(userData.map((d) => d["country"]).filter((c) => c && c !== ""))
    ).sort();
    populateCountrySelector(countries, "vis-comparison-dropdown-countries");

    // render chart with data
    renderComparisonChart(userData, advertiserData);
  } else {
    renderComparisonChart([], []);
  }

  function handleUserData(userData) {
    // loop over metrics
    return userData.forEach((d) => {
      userMetrics
        .map((m) => m.value)
        .forEach((metric) => {
          d[metric] = d[metric] ? +d[metric] : null;
        });
    });
  }

  function handleAdvertiserData(advertiserData) {
    // loop over metrics
    return advertiserData.forEach((d) => {
      advertiserMetrics
        .map((m) => m.value)
        .forEach((metric) => {
          d[metric] = d[metric] ? +d[metric] : null;
        });
    });
  }
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
const advertiserMetricDefault = advertiserMetrics[1];

function renderMetricsButtons(metrics, metricDefault, containerId) {
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

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
    // containerElement.innerHTML = "";

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
    // containerElement.innerHTML = "";

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
    start: {
      past: {
        day: "30",
        month: "9",
        year: "2024",
        week: "40",
        full: "2024-09-30",
      },
      current: {
        day: "29",
        month: "9",
        year: "2025",
        week: "40",
        full: "2025-09-29",
      },
    },
    end: {
      past: {
        day: "31",
        month: "3",
        year: "2025",
        week: "14",
        full: "2025-03-31",
      },

      current: {
        day: "30",
        month: "3",
        year: "2026",
        week: "14",
        full: "2026-03-30",
      },
    },
  },
  {
    value: "pre-holiday",
    title: "Pre-holiday",
    subtitle: "October to late November",
    icon: "",
    start: {
      past: {
        day: "30",
        month: "9",
        year: "2024",
        week: "40",
        full: "2024-09-30",
      },
      current: {
        day: "29",
        month: "9",
        year: "2025",
        week: "40",
        full: "2025-09-29",
      },
    },
    end: {
      past: {
        day: "25",
        month: "11",
        year: "2024",
        week: "48",
        full: "2024-11-25",
      },

      current: {
        day: "24",
        month: "11",
        year: "2025",
        week: "48",
        full: "2025-11-24",
      },
    },
  },
  {
    value: "peak-season",
    title: "Peak season",
    subtitle: "Late November to December 25",
    icon: "",
    start: {
      past: {
        day: "25",
        month: "11",
        year: "2024",
        week: "48",
        full: "2024-11-25",
      },
      current: {
        day: "24",
        month: "11",
        year: "2025",
        week: "48",
        full: "2025-11-24",
      },
    },
    end: {
      past: {
        day: "30",
        month: "12",
        year: "2024",
        week: "1",
        full: "2024-12-30",
      },
      current: {
        day: "29",
        month: "12",
        year: "2025",
        week: "1",
        full: "2025-12-29",
      },
    },
  },
  {
    value: "post-holiday",
    title: "Post-holiday Q5",
    subtitle: "December 26 to March",
    icon: "",
    start: {
      past: {
        day: "30",
        month: "12",
        year: "2024",
        week: "1",
        full: "2024-12-30",
      },
      current: {
        day: "29",
        month: "12",
        year: "2025",
        week: "1",
        full: "2025-12-29",
      },
    },
    end: {
      past: {
        day: "31",
        month: "3",
        year: "2025",
        week: "14",
        full: "2025-03-31",
      },

      current: {
        day: "30",
        month: "3",
        year: "2026",
        week: "14",
        full: "2026-03-30",
      },
    },
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

function renderComparisonChart(userData, advertiserData) {
  const containerId = "vis-comparison-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${ComparisonChart}
        userData=${userData}
        advertiserData=${advertiserData}
      />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

// time scales
// year can be "past" or "current"
// period can be "all", "pre-holiday", "peak-season", "post-holiday"
function getTimeScale(year = "past", period) {
  const periodObj = periods.find((p) => p.value === period);
  let startY = periodObj.start[year].year || null;
  let startMonth = periodObj.start[year].month || null;
  let startDay = periodObj.start[year].day || null;
  let endY = periodObj.end[year].year || null;
  let endMonth = periodObj.end[year].month || null;
  let endDay = periodObj.end[year].day || null;

  const start = Date.UTC(startY, startMonth - 1, startDay);
  const end = Date.UTC(endY, endMonth - 1, endDay);

  return d3.scaleLinear().domain([start, end]);
}

function getWeekNumberArray(year = "past", period) {
  const periodObj = periods.find((p) => p.value === period);
  let startWeek = periodObj.start[year].week || null;
  let endWeek = periodObj.end[year].week || null;

  // const weekNumberArray = d3.range(40, 53).concat(d3.range(1, 15));
  if (endWeek < startWeek) {
    return d3.range(startWeek, 53).concat(d3.range(1, Number(endWeek) + 1));
  }
  return d3.range(startWeek, Number(endWeek) + 1);
}

function ComparisonChart({ userData, advertiserData }) {
  const [system, setSystem] = useState(
    getDropdownValue("vis-comparison-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-comparison-dropdown-countries") || "USA"
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [year, setYear] = useState("past");
  const [period, setPeriod] = useState("pre-holiday");
  const [userMetric, setUserMetric] = useState(userMetricDefault.value);
  const [advertiserMetric, setAdvertiserMetric] = useState(
    advertiserMetricDefault.value
  );
  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

  const [chartUserData, setChartUserData] = useState(filterData(userData));
  const [chartAdvertiserData, setChartAdvertiserData] = useState(
    filterData(advertiserData)
  );

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
    setChartUserData(filterData(userData));
    setChartAdvertiserData(filterData(advertiserData));
  }, [system, country, category, vertical, userData, advertiserData]);

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
    chartUserData,
    chartAdvertiserData,
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
  // months display
  const displayMonths = months
    .map((month) => {
      const monthStart = getDateInUTC(month.begin);
      const monthEnd = getDateInUTC(month.end);
      const periodObj = periods.find((p) => p.value === period);
      if (!periodObj) return false;

      let periodStart = getDateInUTC(periodObj.start[year].full);
      let periodEnd = getDateInUTC(periodObj.end[year].full);
      if (
        monthEnd >= periodStart &&
        monthStart <= periodEnd &&
        year === month.year
      ) {
        return {
          ...month,
          begin:
            monthStart < periodStart ? periodObj.start[year].full : month.begin,
          end: monthEnd > periodEnd ? periodObj.end[year].full : month.end,
        };
      }
      return null;
    })
    .filter((m) => m !== null);

  // scales
  const timeScale = getTimeScale(year, period).range([0, innerWidth]);
  const weekNumberArray = getWeekNumberArray(year, period);

  const weekScale = d3
    .scalePoint()
    .domain(weekNumberArray)
    .range([0, innerWidth]);

  // lines
  const datapointsUser = chartUserData
    .filter((d) => {
      const date = getDateInUTC(d.week_start);
      return date >= timeScale.domain()[0] && date <= timeScale.domain()[1];
    })
    .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start));

  const datapointsAdvertiser = chartAdvertiserData
    .filter((d) => {
      const date = getDateInUTC(d.week_start);
      return date >= timeScale.domain()[0] && date <= timeScale.domain()[1];
    })
    .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start));

  const maxUserValue = d3.max(chartUserData, (d) => d[userMetric]);
  const valueUserScale = d3
    .scaleLinear()
    .domain([0, maxUserValue])
    .range([innerHeight, 0]);

  const maxAdvertiserValue = d3.max(
    chartAdvertiserData,
    (d) => d[advertiserMetric]
  );
  const valueAdvertiserScale = d3
    .scaleLinear()
    .domain([0, maxAdvertiserValue])
    .range([innerHeight, 0]);

  const lineUserGen = d3
    .line()
    .y((d) => valueUserScale(d[userMetric]))
    .x((d) => weekScale(d.weekNumber))
    .defined((d) => d[userMetric] !== null);

  const lineAdvertiserGen = d3
    .line()
    .y((d) => valueAdvertiserScale(d[advertiserMetric]))
    .x((d) => weekScale(d.weekNumber))
    .defined((d) => d[advertiserMetric] !== null);

  const userLine = lineUserGen(datapointsUser);
  const advertiserLine = lineAdvertiserGen(datapointsAdvertiser);

  const highlightUser = hoveredValues
    ? datapointsUser.find((d) => d.weekNumber === hoveredValues?.week)
    : null;
  const highlightAdvertiser = hoveredValues
    ? datapointsAdvertiser.find((d) => d.weekNumber === hoveredValues?.week)
    : null;

  return html`<div style="position: relative;">
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; border: 1px solid transparent;"
      onmouseleave="${() => setHoveredValues(null)}"
      onmousemove="${(event) => {
        if (
          !chartUserData ||
          chartUserData.length === 0 ||
          !chartAdvertiserData ||
          chartAdvertiserData.length === 0
        )
          return;
        const pointer = d3.pointer(event);

        const leftSide = margin.left;
        const rightSide = leftSide + innerWidth;

        if (
          pointer[0] >= leftSide &&
          pointer[0] <= rightSide &&
          pointer[1] >= margin.top &&
          pointer[1] <= height - margin.bottom
        ) {
          const innerX = pointer[0] - margin.left;

          const index = Math.floor(innerX / weekScale.step());
          const hoveredWeek = weekScale.domain()[index];

          // get value for hoveredItem
          const datapointUser = datapointsUser.find(
            (d) => d.weekNumber === hoveredWeek
          );

          let tooltipX = innerX + margin.left;
          if (tooltipX + 150 > width) {
            tooltipX = width - 160;
          }
          const userVariable = userMetrics.find(
            (m) => m.value === userMetric
          ).label;
          const advertiserVariable = advertiserMetrics.find(
            (m) => m.value === advertiserMetric
          ).label;

          setHoveredValues({
            tooltipX: tooltipX + 20,
            tooltipY: margin.top + 50,
            week: hoveredWeek,
            firstDayOfWeek: datapointUser.week_start || null,
            userVariable,
            advertiserVariable,
            // valuePrev: datapointPrev[metric] || null,
            // valueCurrent: datapointCurrent[metric] || null,
          });
        } else {
          setHoveredValues(null);
        }
      }}"
    >
      <g>
        ${holidays.map((holiday) => {
          const x = timeScale(getDateInUTC(holiday.date)) + margin.left;
          if (isNaN(x) || x < margin.left) return null;
          if (x > width - margin.right) return null;
          return html`<g transform="translate(${x}, 0)">
            <image
              href="${ASSETS_URL}${holiday.icon}"
              transform="translate(-${35 / 2},
                    5)"
              onmouseleave="${() => setHoveredHoliday(null)}"
              onmouseenter="${() => {
                setHoveredHoliday({
                  name: holiday.name,
                  date: holiday.displayDate,
                  tooltipX: x + 20,
                  tooltipY: 0 + 20,
                });
              }}"
              style="cursor: pointer;"
            />
            <line
              x1="0"
              x2="0"
              y1="${margin.top}"
              y2="${height - margin.bottom}"
              stroke="#D5D5D5"
              stroke-width="1.5"
              stroke-dasharray="4,4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <rect
              x="-5"
              y="${height - margin.bottom + 5}"
              width="10"
              height="10"
              fill="#040078"
            />
          </g>`;
        })}
      </g>

      <g transform="translate(${margin.left},${margin.top})">
        <rect
          x="0"
          y="0"
          width="${innerWidth}"
          height="${innerHeight}"
          fill="none"
          stroke="none"
        />
        <path
          d="${userLine}"
          fill="none"
          stroke="#60E2B7"
          stroke-width="3"
          style="transition: all ease 0.3s"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="${advertiserLine}"
          fill="none"
          stroke="#876AFF"
          stroke-width="3"
          style="transition: all ease 0.3s"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        ${hoveredValues && highlightUser
          ? html`<circle
              cx="${weekScale(hoveredValues.week)}"
              cy="${valueUserScale(
                highlightUser ? highlightUser[userMetric] : 0
              )}"
              r="5"
              fill="#60E2B7"
              style="transition: all ease 0.3s"
            />`
          : ""}
        ${hoveredValues && highlightAdvertiser
          ? html`<circle
              cx="${weekScale(hoveredValues.week)}"
              cy="${valueAdvertiserScale(
                highlightAdvertiser ? highlightAdvertiser[advertiserMetric] : 0
              )}"
              r="5"
              fill="#876AFF"
              style="transition: all ease 0.3s"
            />`
          : ""}

        <g>
          ${displayMonths.map((month) => {
            const xBegin = timeScale(getDateInUTC(month.begin)) || null;
            const xEnd = timeScale(getDateInUTC(month.end)) || null;
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
                fill-opacity="${(xEnd - xBegin) / 2 < 30 ? 0 : 1}"
              >
                ${month.name}
              </text>
            </g>`;
          })}
        </g>
      </g>
    </svg>
    <${TooltipHoliday} hoveredItem=${hoveredHoliday} />
    <${TooltipValues} hoveredItem=${hoveredValues} />
  </div>`;
}

function TooltipValues({ hoveredItem }) {
  if (!hoveredItem) return null;

  const formattedDay = hoveredItem.firstDayOfWeek
    ? d3.utcFormat("%b %d, %Y")(getDateInUTC(hoveredItem.firstDayOfWeek))
    : null;
  const formattedYear = formattedDay ? formattedDay.split(", ")[1] : null;

  return html`<div
    class="tooltip"
    style="left: ${hoveredItem.tooltipX}px; top: ${hoveredItem.tooltipY}px;"
  >
    <p class="tooltip-title">
      Week ${hoveredItem.week} in ${formattedYear}<br />
      ${hoveredItem.firstDayOfWeek ? `(starts ${formattedDay})` : ""}
    </p>

    <div>
      <p class="tooltip-label">${hoveredItem.userVariable} weekly change</p>
      <p class="tooltip-value">...</p>
    </div>

    <div style="border-top: 1px solid #D9D9D9; width: 100%;" />

    <div>
      <p class="tooltip-label">
        ${hoveredItem.advertiserVariable} weekly change
      </p>
      <p class="tooltip-value">...</p>
    </div>
  </div>`;
}
