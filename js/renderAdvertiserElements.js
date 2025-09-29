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
import {
  valueFormatting,
  prevTimeScaleUTC,
  currentTimeScaleUTC,
  getDateInUTC,
  ASSETS_URL,
} from "./helpers.js";
import { holidays } from "./holidays.js";
import TooltipHoliday from "./TooltipHoliday.js";

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

      d["category"] =
        d["category"].toLowerCase() === "non-gaming"
          ? "consumer"
          : d["category"].toLowerCase();
      d["vertical"] = d["vertical"].toLowerCase().trim();

      d["week_start"] = d["week_start_date"];
      d["weekNumber"] = +d["Week Number"].trim();
      // loop over metrics
      metrics
        .map((m) => m.value)
        .forEach((metric) => {
          d[metric] = d[metric] ? +d[metric] : null;
        });
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
const metricDefault = metrics[1];

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
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [metric, setMetric] = useState(metricDefault.value);
  const [chartData, setChartData] = useState(filterData(data));

  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

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

  console.log(
    "Rendering advertiser chart",
    chartData,
    system,
    country,
    category,
    vertical,
    metric
  );

  // set up vis dimensions
  const visContainer = document.querySelector(`#vis-advertiser-container`);
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height = 600;
  const margin = { top: 40, right: 1, bottom: 60, left: 1 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const prevTime = prevTimeScaleUTC.range([0, innerWidth]);
  const currentTime = currentTimeScaleUTC.range([0, innerWidth]);

  // array with weeknumbers starting at 40, 40 until 52, then 1 until 14
  const weekNumberArray = d3.range(40, 53).concat(d3.range(1, 15));
  const weekScale = d3
    .scalePoint()
    .domain(weekNumberArray)
    .range([0, innerWidth]);

  const datapointsPrev = chartData
    .filter((d) => {
      const date = getDateInUTC(d.week_start);
      return date >= prevTime.domain()[0] && date <= prevTime.domain()[1];
    })
    .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start));

  const datapointsCurrent = chartData
    .filter((d) => {
      const date = getDateInUTC(d.week_start);
      return date >= currentTime.domain()[0] && date <= currentTime.domain()[1];
    })
    .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start));

  const maxValue = d3.max(chartData, (d) => d[metric]);
  const valueScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([innerHeight, 0]);

  const lineGen = d3
    .line()
    .y((d) => valueScale(d[metric]))
    .x((d) => weekScale(d.weekNumber))
    .defined((d) => d[metric] !== null);

  const prevLine = lineGen(datapointsPrev);
  const currentLine = lineGen(datapointsCurrent);

  return html`<div style="position: relative;">
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <g>
        ${holidays.map((holiday, index) => {
          const x = 250 + index * 100;
          return html`<g transform="translate(${x}, 0)">
            <image
              href="${ASSETS_URL}${holiday.icon}"
              transform="translate(-14,
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
        <g>
          <rect
            x="0"
            y="${innerHeight + 20}"
            width="${innerWidth}"
            height="${33}"
            fill="#f0f0f0"
            fill-opacity="0.8"
          />
        </g>
        <rect
          x="0"
          y="0"
          width="${innerWidth}"
          height="${innerHeight}"
          fill="transparent"
          stroke="black"
        />
        <path
          d="${prevLine}"
          fill="none"
          stroke="#876AFF"
          stroke-width="3"
          stroke-dasharray="0.1,5"
          style="transition: all ease 0.3s"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="${currentLine}"
          fill="none"
          stroke="#876AFF"
          stroke-width="3"
          style="transition: all ease 0.3s"
        />
      </g>
    </svg>
    <${TooltipHoliday} hoveredItem=${hoveredHoliday} />
    <${TooltipValues} hoveredItem=${hoveredValues} />
  </div>`;
}

function TooltipValues({ hoveredItem }) {
  if (!hoveredItem) return null;

  const formattedDayPrev = hoveredItem.firstDayOfWeekPrev
    ? d3.utcFormat("%b %d, %Y")(getDateInUTC(hoveredItem.firstDayOfWeekPrev))
    : null;
  const formattedDayCurrent = hoveredItem.firstDayOfWeekCurrent
    ? d3.utcFormat("%b %d, %Y")(getDateInUTC(hoveredItem.firstDayOfWeekCurrent))
    : null;

  return html`<div
    class="tooltip"
    style="left: ${hoveredItem.tooltipX}px; top: ${hoveredItem.tooltipY}px;"
  >
    <p class="tooltip-title">
      Week ${hoveredItem.week} in 2024<br />${hoveredItem.firstDayOfWeekPrev
        ? `(starts ${formattedDayPrev})`
        : ""}
    </p>
    <div>
      <p class="tooltip-label">${hoveredItem.variable1}</p>
      <p class="tooltip-value">
        ${hoveredItem.costPrev
          ? variableFormatting[buttonToVariableMapping[hoveredItem.variable1]](
              hoveredItem.costPrev,
              2
            )
          : "-"}
      </p>
    </div>
    <div>
      <p class="tooltip-label">${hoveredItem.variable2}</p>
      <p class="tooltip-value">
        ${hoveredItem.spendPrev
          ? variableFormatting[buttonToVariableMapping[hoveredItem.variable2]](
              hoveredItem.spendPrev,
              0
            )
          : "-"}
      </p>
    </div>
    <div style="border-top: 1px solid #D9D9D9; width: 100%;" />
    <p class="tooltip-title">
      Week ${hoveredItem.week} in 2025<br />
      ${hoveredItem.firstDayOfWeekCurrent
        ? `(starts ${formattedDayCurrent})`
        : ""}
    </p>
    <div>
      <p class="tooltip-label">${hoveredItem.variable1}</p>
      <p class="tooltip-value">
        ${hoveredItem.costCurrent
          ? variableFormatting[buttonToVariableMapping[hoveredItem.variable1]](
              hoveredItem.costCurrent,
              2
            )
          : "-"}
      </p>
    </div>
    <div>
      <p class="tooltip-label">${hoveredItem.variable2}</p>
      <p class="tooltip-value">
        ${hoveredItem.spendCurrent
          ? variableFormatting[buttonToVariableMapping[hoveredItem.variable2]](
              hoveredItem.spendCurrent,
              0
            )
          : "-"}
      </p>
    </div>
  </div>`;
}
