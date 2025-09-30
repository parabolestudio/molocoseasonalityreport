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
  prevTimeScaleUTC,
  currentTimeScaleUTC,
  getDateInUTC,
  ASSETS_URL,
  isMobile,
} from "./helpers.js";
import { holidays } from "./holidays.js";
import TooltipHoliday from "./TooltipHoliday.js";
import Loader from "./Loader.js";

export function renderAdvertiserElements(data) {
  console.log("Rendering advertiser elements");

  // populate system selector
  populateSystemSelector("vis-advertiser-dropdown-systems");

  // render metrics buttons
  renderMetricsButtons();

  populateCountrySelector(["USA"], "vis-advertiser-dropdown-countries");

  if (data && data.length > 0) {
    // format data
    handleData(data);

    // populate country selector
    const countries = Array.from(
      new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
    ).sort();
    populateCountrySelector(countries, "vis-advertiser-dropdown-countries");

    // render chart with data
    renderAdvertiserChart(data);
  } else {
    renderAdvertiserChart(null);
  }

  function handleData(data) {
    // loop over metrics
    return data.forEach((d) => {
      metrics
        .map((m) => m.value)
        .forEach((metric) => {
          // replace all commas in numbers before converting to numeric to handle bid requests like "1,234,567"
          d[metric] = d[metric]
            ? typeof d[metric] === "string" && d[metric].includes(",")
              ? +d[metric].replaceAll(",", "")
              : +d[metric]
            : null;
          // d[metric + "_wow"] = d[metric + "_wow_pct_change"]
          //   ? +d[metric + "_wow_pct_change"]
          //   : null;
        });
    });
  }
}

function renderMetricsButtons() {
  const containerId = "vis-advertiser-metrics";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

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
    // containerElement.innerHTML = "";

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
  console.log("Rendering advertiser chart component", data);
  const [system, setSystem] = useState(
    getDropdownValue("vis-advertiser-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-advertiser-dropdown-countries") || "USA"
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [metric, setMetric] = useState(metricDefault.value);
  const [chartData, setChartData] = useState(filterData(data));

  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

  function filterData(inputData) {
    if (!inputData || inputData.length === 0) return null;
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
  }, [system, country, category, vertical, data]);

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
  const margin = { top: 50, right: 1, bottom: 60, left: 1 };
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
    ? chartData
        .filter((d) => {
          const date = getDateInUTC(d.week_start);
          return date >= prevTime.domain()[0] && date <= prevTime.domain()[1];
        })
        .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start))
    : [];

  const datapointsCurrent = chartData
    ? chartData
        .filter((d) => {
          const date = getDateInUTC(d.week_start);
          return (
            date >= currentTime.domain()[0] && date <= currentTime.domain()[1]
          );
        })
        .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start))
    : [];

  const maxValue = chartData ? d3.max(chartData, (d) => d[metric]) : 0;
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

  const highlightPrev = hoveredValues
    ? datapointsPrev.find((d) => d.weekNumber === hoveredValues?.week)
    : null;
  const highlightCurrent = hoveredValues
    ? datapointsCurrent.find((d) => d.weekNumber === hoveredValues?.week)
    : null;

  const months = [
    {
      name: "October",
      begin: "2024-10-01",
      end: "2024-10-31",
    },
    { name: "November", begin: "2024-11-01", end: "2024-11-30" },
    { name: "December", begin: "2024-12-01", end: "2024-12-31" },
    { name: "January", begin: "2025-01-01", end: "2025-01-31" },
    { name: "February", begin: "2025-02-01", end: "2025-02-28" },
    { name: "March", begin: "2025-03-01", end: "2025-03-31" },
  ];

  return html`<div style="position: relative;">
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%;"
      onmouseleave="${() => setHoveredValues(null)}"
      onmousemove="${(event) => {
        if (!chartData || chartData.length === 0) return;
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
          const datapointPrev =
            datapointsPrev.find((d) => d.weekNumber === hoveredWeek) || {};
          const datapointCurrent =
            datapointsCurrent.find((d) => d.weekNumber === hoveredWeek) || {};

          let tooltipX = innerX + margin.left;
          if (tooltipX + 150 > width) {
            tooltipX = width - 160;
          }

          setHoveredValues({
            tooltipX: tooltipX + 20,
            tooltipY: margin.top + 50,
            week: hoveredWeek,
            firstDayOfWeekPrev: datapointPrev.week_start || null,
            firstDayOfWeekCurrent: datapointCurrent.week_start || null,
            variable: metric,
            title: metrics.find((m) => m.value === metric).label,
            valuePrev: datapointPrev[metric] || null,
            valueCurrent: datapointCurrent[metric] || null,
          });
        } else {
          setHoveredValues(null);
        }
      }}"
    >
      <g>
        ${holidays.map((holiday, index) => {
          const x =
            currentTimeScaleUTC(getDateInUTC(holiday.date.current)) +
            margin.left;
          if (isNaN(x) || x < margin.left) return null;
          if (x > width - margin.right) return null;

          let offsetX = 0;
          const prevX =
            currentTimeScaleUTC(
              getDateInUTC(
                holidays[
                  Math.max(
                    0,
                    holidays.findIndex((h) => h.name === holiday.name) - 1
                  )
                ].date.current
              )
            ) + margin.left;
          if (x - prevX < 40 && index !== 0 && !isMobile) offsetX = 40;

          return html`<g transform="translate(${x}, 0)">
            <image
              href="${ASSETS_URL}${holiday.icon}"
              transform="translate(${isMobile
                ? -20 / 2
                : -35 / 2 + offsetX}, 5)"
              width="${isMobile ? 20 : 35}"
              height="${isMobile ? 20 : 35}"
              onmouseleave="${() => setHoveredHoliday(null)}"
              onmouseenter="${() => {
                setHoveredHoliday({
                  name: holiday.name,
                  date: holiday.displayDateMerged,
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
            <line
              x1="0"
              x2="${offsetX}"
              y1="${margin.top}"
              y2="${margin.top}"
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
              stroke="#F8F8F8"
            />
          </g>`;
        })}
      </g>
      <g transform="translate(${margin.left},${margin.top})">
        <g>
          ${months.map((month) => {
            const xBegin = prevTimeScaleUTC(getDateInUTC(month.begin)) || null;
            const xEnd = prevTimeScaleUTC(getDateInUTC(month.end)) || null;
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

        <rect
          x="0"
          y="0"
          width="${innerWidth}"
          height="${innerHeight}"
          fill="transparent"
          stroke="transparent"
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
        ${hoveredValues && highlightPrev
          ? html`<circle
              cx="${weekScale(hoveredValues.week)}"
              cy="${valueScale(highlightPrev ? highlightPrev[metric] : 0)}"
              r="5"
              fill="#876AFF"
              style="transition: all ease 0.3s"
            />`
          : ""}
        ${hoveredValues && highlightCurrent
          ? html`<circle
              cx="${weekScale(hoveredValues.week)}"
              cy="${valueScale(
                highlightCurrent ? highlightCurrent[metric] : 0
              )}"
              r="5"
              fill="#876AFF"
              style="transition: all ease 0.3s"
            />`
          : ""}
      </g>
    </svg>
    <${TooltipHoliday} hoveredItem=${hoveredHoliday} />
    <${TooltipValues} hoveredItem=${hoveredValues} />
    <${Loader} isLoading=${data === null} y=${innerHeight / 2 + 50} />
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
    <p class="tooltip-title">${hoveredItem.title} weekly change</p>

    <div>
      <p class="tooltip-label">
        Week ${hoveredItem.week} in 2025<br />
        ${hoveredItem.firstDayOfWeekCurrent
          ? `(starts ${formattedDayCurrent})`
          : ""}
      </p>
    </div>

    <div style="border-top: 1px solid #D9D9D9; width: 100%;" />

    <div>
      <p class="tooltip-label">
        Week ${hoveredItem.week} in 2024<br />${hoveredItem.firstDayOfWeekPrev
          ? `(starts ${formattedDayPrev})`
          : ""}
      </p>
    </div>
  </div>`;
}

//  <p class="tooltip-value">
//         ${hoveredItem.valueCurrent ? hoveredItem.valueCurrent : "-"}
//       </p>
// <p class="tooltip-value">
//         ${hoveredItem.valuePrev ? hoveredItem.valuePrev : "-"}
//       </p>
