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
  isMobile,
  isTablet,
  monthsPastYear,
  getPrecalculatedHolidayPositions,
  holidayStyles,
  metricsLabels,
} from "./helpers.js";
import TooltipHoliday from "./TooltipHoliday.js";
import Loader from "./Loader.js";
import NoDataElement from "./NoDataElement.js";
import { holidayIcons } from "./holidays.js";

export function renderAdvertiserElements(data, includedVerticalData) {
  console.log("Rendering advertiser elements");

  // populate system selector
  populateSystemSelector("vis-advertiser-dropdown-systems");

  // render metrics buttons
  renderMetricsButtons();

  populateCountrySelector(["WW"], "vis-advertiser-dropdown-countries");

  if (data && data.length > 0) {
    // format data
    handleData(data);

    // populate country selector
    const countries = Array.from(
      new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
    ).sort();
    populateCountrySelector(countries, "vis-advertiser-dropdown-countries");

    // render chart with data
    renderAdvertiserChart(data, includedVerticalData);
  } else {
    renderAdvertiserChart(null, null);
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
  { value: "ad_opportunities", label: "Ad opportunities" },
  { value: "cpm_p50", label: "CPM" },
  { value: "cpi_p50", label: "CPI" },
  { value: "roas_d7_p50", label: "ROAS" },
  { value: "arppu_d7_p50", label: "ARPPU" },
];
const metricDefault = metrics[0];

function AdvertiserMetricsButtons() {
  const [selectedMetric, setSelectedMetric] = useState(metricDefault.value);
  const [hoveredMetricItem, setHoveredMetric] = useState(null);

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
          onmouseleave="${() => setHoveredMetric(null)}"
          onmouseenter="${(event) => {
            const buttonRect = event.target.getBoundingClientRect();
            const containerRect =
              event.target.parentElement.getBoundingClientRect();

            // Calculate position relative to the container, positioning tooltip below button
            const x =
              buttonRect.left - containerRect.left + buttonRect.width / 2 - 75; // Center tooltip on button relative to container
            const y = buttonRect.bottom - containerRect.top + 5; // Position just below button with small gap

            // Adjust if tooltip would go off-screen to the right
            const containerWidth = containerRect.width;
            const adjustedX =
              x + 150 > containerWidth ? containerWidth - 160 : x;

            setHoveredMetric({
              value: metric.value,
              x: Math.max(10, adjustedX), // Ensure tooltip doesn't go off-screen to the left
              y: y,
            });
          }}"
        >
          ${metric.label}
        </button>`
    )}
    ${hoveredMetricItem &&
    html`<div
      class="tooltip"
      style="left: ${hoveredMetricItem.x}px; top: ${hoveredMetricItem.y}px;}"
    >
      <p class="tooltip-label" style="white-space: nowrap;">
        ${metricsLabels[hoveredMetricItem.value]}
      </p>
    </div>`}
  </div>`;
}

function renderAdvertiserChart(data, includedVerticalData) {
  const containerId = "vis-advertiser-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${AdvertiserChart}
        data=${data}
        includedVerticalData=${includedVerticalData}
      />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function AdvertiserChart({ data, includedVerticalData }) {
  console.log("Rendering advertiser chart component", data);
  const [system, setSystem] = useState(
    getDropdownValue("vis-advertiser-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-advertiser-dropdown-countries") || "WW"
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [metric, setMetric] = useState(metricDefault.value);
  const [chartData, setChartData] = useState(
    filterData(data, includedVerticalData)
  );

  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

  const [svgCache, setSvgCache] = useState({});

  // Fetch and cache SVG content
  const fetchSvgContent = async (iconPath) => {
    if (svgCache[iconPath]) {
      return svgCache[iconPath];
    }
    try {
      const response = await fetch(ASSETS_URL + iconPath);
      const svgText = await response.text();
      setSvgCache((prev) => ({ ...prev, [iconPath]: svgText }));
      return svgText;
    } catch (error) {
      console.error("Error fetching SVG:", error);
      return null;
    }
  };

  // Pre-fetch holiday SVG icons on mount
  useEffect(async () => {
    const iconPathsHolidays = holidayIcons.map((d) => d.icon);
    for (const iconPath of iconPathsHolidays) {
      await fetchSvgContent(iconPath);
    }
  }, []);

  function filterData(inputData, includedVerticalData) {
    if (!inputData || inputData.length === 0) return null;
    if (includedVerticalData) {
      const filterCombinationIncluded = includedVerticalData.find(
        (v) =>
          v.vertical === vertical &&
          v.country === country &&
          v.system === system
      );
      if (!filterCombinationIncluded) {
        return [];
      }
    }

    return inputData.filter(
      (d) =>
        d.system === system &&
        d.country === country &&
        d.category === category &&
        d.vertical === vertical
    );
  }
  useEffect(() => {
    setChartData(filterData(data, includedVerticalData));
  }, [system, country, category, vertical, data, includedVerticalData]);

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
  const height = isMobile ? 400 : 600;
  const margin = { top: 60, right: 1, bottom: 60, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (chartData && chartData.length === 0) {
    return html`<${NoDataElement}
      width=${width}
      height=${height}
      vertical=${vertical}
    />`;
  }

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

  const allDatapoints = chartData
    ? [...datapointsPrev, ...datapointsCurrent].filter(
        (d) => d[metric] !== null && d[metric] !== undefined
      )
    : [];
  const maxValue = d3.max(allDatapoints, (d) => d[metric]);
  const minValue = d3.min(allDatapoints, (d) => d[metric]);

  const valueScale = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range([innerHeight, 0])
    .nice();

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

  const holidayPositions = getPrecalculatedHolidayPositions(
    currentTime,
    "current",
    margin,
    width
  );

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
        ${holidayPositions.map(({ holiday, x, offsetX, offsetY }) => {
          return html`<g transform="translate(${x}, 0)">
            <line
              x1="0"
              x2="0"
              y1="${isMobile || isTablet
                ? 45 - (offsetY > 5 && offsetX >= 0 ? 0 : 30)
                : 45}"
              y2="${height - margin.bottom}"
              stroke="${holidayStyles.line.stroke}"
              stroke-width="${holidayStyles.line["stroke-width"]}"
              stroke-dasharray="${holidayStyles.line["stroke-dasharray"]}"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="0"
              x2="${offsetX}"
              y1="${45}"
              y2="${45}"
              stroke="${holidayStyles.line.stroke}"
              stroke-width="${holidayStyles.line["stroke-width"]}"
              stroke-dasharray="${holidayStyles.line["stroke-dasharray"]}"
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
        ${holidayPositions.map(({ holiday, x, offsetX, offsetY }) => {
          const svgContent = svgCache[holiday.icon];
          return html`<g transform="translate(${x}, 0)">
            <g
              class="holiday-icon-svg"
              transform="translate(${isMobile || isTablet
                ? -20 / 2 + offsetX
                : -35 / 2 + offsetX}, ${offsetY}) scale(${isMobile || isTablet
                ? 0.52
                : 1})"
              onmouseleave="${() => setHoveredHoliday(null)}"
              onmouseenter="${() => {
                setHoveredHoliday({
                  name: holiday.name,
                  date: holiday.displayDate["current"],
                  tooltipX: x + 20,
                  tooltipY: 0 + 20,
                });
              }}"
              style="cursor: pointer;"
              dangerouslySetInnerHTML=${{ __html: svgContent || "" }}
            ></g>
          </g>`;
        })}
      </g>
      <g transform="translate(${margin.left},${margin.top})">
        <g>
          ${monthsPastYear.map((month, i) => {
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
                font-size="14"
                font-weight="400"
                font-family="Montserrat, sans-serif"
                style="line-height: 1.25"
                fill-opacity="${isMobile
                  ? i === 0 || i === monthsPastYear.length - 1
                    ? 1
                    : 0
                  : 1}"
              >
                ${isMobile ? month.shortName : month.name}
              </text>
            </g>`;
          })}
        </g>

        ${minValue &&
        maxValue &&
        valueScale &&
        html`
          <g class="y-axis">
            ${valueScale.domain()[1] - 5 > 100
              ? html` <text
                  x="${0 - 5}"
                  y="${valueScale(valueScale.domain()[1])}"
                  text-anchor="end"
                  dominant-baseline="middle"
                  class="charts-text-body"
                  font-size="14"
                  font-weight="400"
                  font-family="Montserrat, sans-serif"
                  style="line-height: 1.25"
                >
                  ${valueScale.domain()[1]}
                </text>`
              : ""}
            <line
              x1="0"
              x2="${innerWidth}"
              y1="${valueScale(100)}"
              y2="${valueScale(100)}"
              stroke="#D5D5D5"
            />
            <text
              x="${0 - 5}"
              y="${valueScale(100)}"
              text-anchor="end"
              dominant-baseline="middle"
              class="charts-text-body"
              font-size="14"
              font-weight="400"
              font-family="Montserrat, sans-serif"
              style="line-height: 1.25"
            >
              100
            </text>
            <text
              x="${0 - 5}"
              y="${valueScale(valueScale.domain()[0])}"
              text-anchor="end"
              dominant-baseline="middle"
              class="charts-text-body"
              font-size="14"
              font-weight="400"
              font-family="Montserrat, sans-serif"
              style="line-height: 1.25"
            >
              ${valueScale.domain()[0]}
            </text>
          </g>
        `}
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
    <p class="tooltip-title">${hoveredItem.title}, indexed</p>
    ${hoveredItem.firstDayOfWeekCurrent
      ? html` <div>
          <p class="tooltip-label">
            Week of ${hoveredItem.firstDayOfWeekCurrent}
          </p>
          <p class="tooltip-value">
            ${hoveredItem.valueCurrent
              ? valueFormatting.indexed(hoveredItem.valueCurrent)
              : "-"}
          </p>
        </div>`
      : ""}
    ${hoveredItem.firstDayOfWeekCurrent && hoveredItem.firstDayOfWeekPrev
      ? html` <div style="border-top: 1px solid #D9D9D9; width: 100%;" />`
      : ""}
    ${hoveredItem.firstDayOfWeekPrev
      ? html` <div>
          <p class="tooltip-label">Week of ${formattedDayPrev}</p>
          <p class="tooltip-value">
            ${hoveredItem.valuePrev
              ? valueFormatting.indexed(hoveredItem.valuePrev)
              : "-"}
          </p>
        </div>`
      : ""}
  </div>`;
}
