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

export function renderUserElements(data = null) {
  // populate system selector
  populateSystemSelector("vis-user-dropdown-systems");

  if (data && data.length > 0) {
    // format data

    // populate country selector
    const countries = Array.from(
      new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
    ).sort();
    populateCountrySelector(countries, "vis-user-dropdown-countries");

    // render chart with data
    renderUserChart(data);
  } else {
    renderUserChart([]);
  }
}

function renderUserChart(data) {
  const containerId = "vis-user-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${UserChart} data=${data} />`, containerElement);
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function UserChart({ data }) {
  // return html`<p>test</p>`;
  const [system, setSystem] = useState(
    getDropdownValue("vis-user-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-user-dropdown-countries") || "USA"
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [chartData, setChartData] = useState(filterData(data));

  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

  function filterData(inputData) {
    if (!inputData || inputData.length === 0) return [];
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
  }, [system, country, vertical, category, data]);

  // console.log(
  //   "Rendering user chart",
  //   chartData,
  //   system,
  //   country,
  //   category,
  //   vertical
  // );

  // listen to change in user system dropdown
  useEffect(() => {
    const handleSystemChange = (e) => setSystem(e.detail.selectedSystem);
    document.addEventListener(
      "vis-user-dropdown-systems-changed",
      handleSystemChange
    );
    return () => {
      document.removeEventListener(
        "vis-user-dropdown-systems-changed",
        handleSystemChange
      );
    };
  }, []);

  // listen to change in user country dropdown
  useEffect(() => {
    const handleCountryChange = (e) => setCountry(e.detail.selectedCountry);
    document.addEventListener(
      "vis-user-dropdown-countries-changed",
      handleCountryChange
    );
    return () => {
      document.removeEventListener(
        "vis-user-dropdown-countries-changed",
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

  const charts = [
    {
      title: "WAU",
      value: "wau",
      tooltipTitle: "Weekly Active Users (WAU)",
      data: chartData.map((d) => ({ week_start: d.week_start, value: d.wau })),
    },
    {
      title: "Downloads",
      value: "downloads",
      tooltipTitle: "Downloads",
      data: chartData.map((d) => ({
        week_start: d.week_start,
        value: d.downloads,
      })),
    },
    {
      title: "Revenue",
      value: "revenue",
      tooltipTitle: "Revenue",
      data: chartData.map((d) => ({
        week_start: d.week_start,
        value: d.revenue,
      })),
    },
    {
      title: "Time spent",
      value: "time_spent",
      tooltipTitle: "Time Spent",
      data: chartData.map((d) => ({
        week_start: d.week_start,
        value: d.time_spent,
      })),
    },
  ];

  // set up vis dimensions
  const margin = { top: 50, right: 1, bottom: 50, left: 1 };
  const chartMargin = { top: 40, right: 1, bottom: 35, left: 60 };

  const visContainer = document.querySelector(`#vis-user-container`);
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const innerWidth = width - margin.left - margin.right;
  const chartWidth = innerWidth - chartMargin.left - chartMargin.right;

  const chartInnerHeight = 165;
  const chartHeight = chartInnerHeight + chartMargin.top + chartMargin.bottom;
  const innerHeight = charts.length * chartHeight;

  const height = innerHeight + margin.top + margin.bottom;

  const dimensions = {
    width,
    height,
    margin,
    innerWidth,
    innerHeight,
    chartWidth,
    chartHeight,
    chartMargin,
    chartInnerHeight,
  };

  const prevTime = prevTimeScaleUTC.range([0, chartWidth]);
  const currentTime = currentTimeScaleUTC.range([0, chartWidth]);

  // array with weeknumbers starting at 40, 40 until 52, then 1 until 14
  const weekNumberArray = d3.range(40, 53).concat(d3.range(1, 15));
  const weekScale = d3
    .scalePoint()
    .domain(weekNumberArray)
    .range([0, chartWidth]);

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

  return html`<div style="position: relative;">
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; background-color: transparent"
      onmouseleave="${() => setHoveredValues(null)}"
      onmousemove="${(event) => {
        if (!data || data.length === 0) return;

        const pointer = d3.pointer(event);

        const leftSide = margin.left + chartMargin.left;
        const rightSide = leftSide + chartWidth;

        if (pointer[0] >= leftSide && pointer[0] <= rightSide) {
          const innerX = pointer[0] - margin.left;

          // figure out which chart the pointer is in
          let metricIndex = null;
          if (
            margin.top + chartMargin.top <= pointer[1] &&
            pointer[1] < margin.top + chartMargin.top + chartInnerHeight
          ) {
            metricIndex = 0;
          } else if (
            margin.top + chartHeight + chartMargin.top <= pointer[1] &&
            pointer[1] <=
              margin.top + chartHeight + chartMargin.top + chartInnerHeight
          ) {
            metricIndex = 1;
          } else if (
            margin.top + chartHeight * 2 + chartMargin.top <= pointer[1] &&
            pointer[1] <=
              margin.top + chartHeight * 2 + chartMargin.top + chartInnerHeight
          ) {
            metricIndex = 2;
          } else if (
            margin.top + chartHeight * 3 + chartMargin.top <= pointer[1] &&
            pointer[1] <=
              margin.top + chartHeight * 3 + chartMargin.top + chartInnerHeight
          ) {
            metricIndex = 3;
          }

          const chart = charts[metricIndex];
          if (!chart) {
            setHoveredValues(null);
            return;
          }

          const tooltipY = margin.top + metricIndex * chartHeight;

          const index = Math.floor(innerX / weekScale.step()) - 1;
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
            tooltipY: tooltipY,
            week: hoveredWeek,
            firstDayOfWeekPrev: datapointPrev.week_start || null,
            firstDayOfWeekCurrent: datapointCurrent.week_start || null,
            variable: chart.value,
            title: chart.tooltipTitle,
            valuePrev: datapointPrev[chart.value] || null,
            valueCurrent: datapointCurrent[chart.value] || null,
          });
        } else {
          setHoveredValues(null);
        }
      }}"
    >
      <g>
        ${holidays.map((holiday) => {
          const x =
            prevTimeScaleUTC(getDateInUTC(holiday.date)) +
            margin.left +
            chartMargin.left;
          if (isNaN(x) || x < margin.left + chartMargin.left) return null;
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
                  align: "top",
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
            <image
              href="${ASSETS_URL}${holiday.icon}"
              transform="translate(-${35 / 2}, ${height - margin.bottom + 5})"
              style="cursor: pointer;"
              onmouseleave="${() => setHoveredHoliday(null)}"
              onmouseenter="${() => {
                setHoveredHoliday({
                  name: holiday.name,
                  date: holiday.displayDate,
                  tooltipX: x + 20,
                  tooltipY: 0 + 40,
                  align: "bottom",
                });
              }}"
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
          fill="yellow"
          fill-opacity="0"
        />
        ${charts.map(
          (chart, i) =>
            html`<${SingleChart}
              key=${i}
              index=${i}
              chart=${chart}
              dimensions=${dimensions}
              weekScale=${weekScale}
              datapointsPrev=${datapointsPrev.map((d) => ({
                week_start: d.week_start,
                value: d[chart.value],
                weekNumber: d.weekNumber,
              }))}
              datapointsCurrent=${datapointsCurrent.map((d) => ({
                week_start: d.week_start,
                value: d[chart.value],
                weekNumber: d.weekNumber,
              }))}
              hoveredValues=${hoveredValues}
            />`
        )}
      </g>
    </svg>
    <${TooltipHoliday} hoveredItem=${hoveredHoliday} />
    <${TooltipValues} hoveredItem=${hoveredValues} />
  </div>`;
}

const chartColors = ["#C368F9", "#16D2FF", "#60E2B7", "#876AFF"];

function SingleChart({
  chart,
  index,
  dimensions: dim,
  weekScale,
  datapointsPrev,
  datapointsCurrent,
  hoveredValues,
}) {
  // console.log(
  //   "Rendering single chart:",
  //   chart,
  //   datapointsPrev,
  //   datapointsCurrent
  // );

  const maxValue = d3.max(chart.data, (d) => d.value);
  const valueScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([dim.chartInnerHeight, 0]);

  const lineGen = d3
    .line()
    .y((d) => valueScale(d.value))
    .x((d) => weekScale(d.weekNumber))
    .defined((d) => d.value !== null);

  const prevLine = lineGen(datapointsPrev);
  const currentLine = lineGen(datapointsCurrent);

  const highlightPrev = hoveredValues
    ? datapointsPrev.find((d) => d.weekNumber === hoveredValues?.week)
    : null;
  const highlightCurrent = hoveredValues
    ? datapointsCurrent.find((d) => d.weekNumber === hoveredValues?.week)
    : null;

  return html`<g transform="translate(0, ${index * dim.chartHeight})">
    <rect
      x="0"
      y="0"
      width="${dim.innerWidth}"
      height="${dim.chartHeight}"
      fill="transparent"
      fill-opacity="0"
    />
    <g transform="translate(${dim.chartMargin.left}, ${dim.chartMargin.top})">
      <rect
        x="0"
        y="0"
        width="${dim.chartWidth}"
        height="${dim.chartInnerHeight}"
        fill="orange"
        fill-opacity="0"
      />
      <line x1="0" y1="0" x2="0" y2="${dim.chartInnerHeight}" stroke="black" />
      <line
        x1="0"
        y1="${dim.chartInnerHeight}"
        x2="${dim.chartWidth}"
        y2="${dim.chartInnerHeight}"
        stroke="black"
      />
      ${hoveredValues && highlightPrev
        ? html`<circle
            cx="${weekScale(hoveredValues.week)}"
            cy="${valueScale(highlightPrev ? highlightPrev.value : 0)}"
            r="5"
            fill="${chartColors[index % chartColors.length]}"
            style="transition: all ease 0.3s"
          />`
        : ""}
      ${hoveredValues && highlightCurrent
        ? html`<circle
            cx="${weekScale(hoveredValues.week)}"
            cy="${valueScale(highlightCurrent ? highlightCurrent.value : 0)}"
            r="5"
            fill="${chartColors[index % chartColors.length]}"
            style="transition: all ease 0.3s"
          />`
        : ""}
      <path
        d="${prevLine}"
        fill="none"
        stroke="${chartColors[index % chartColors.length]}"
        stroke-width="3"
        stroke-dasharray="0.1,5"
        style="transition: all ease 0.3s"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="${currentLine}"
        fill="none"
        stroke="${chartColors[index % chartColors.length]}"
        stroke-width="3"
        style="transition: all ease 0.3s"
      />

      <text y=${dim.chartInnerHeight + 20} class="charts-text-body"
        >October</text
      >
      <text
        x=${dim.chartWidth}
        y=${dim.chartInnerHeight + 20}
        class="charts-text-body"
        text-anchor="end"
        >March</text
      >
      ${chart.data.length > 0 &&
      html` <text
        x="-10"
        y=${valueScale(0) - 8}
        class="charts-text-body"
        text-anchor="end"
        dominant-baseline="middle"
        >0</text
      >`}
      ${chart.data.length > 0 &&
      html`<text
        x="-10"
        y=${valueScale(maxValue) + 8}
        class="charts-text-body"
        text-anchor="end"
        dominant-baseline="middle"
        >${valueFormatting[chart.value](maxValue)}</text
      >`}
    </g>
    <text
      x="0"
      y=${dim.chartMargin.top - 20}
      class="charts-text-big-bold"
      dominant-baseline="middle"
    >
      ${chart.title}
    </text>
  </g>`;
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
    <p class="tooltip-title">${hoveredItem.title}</p>

    <div>
      <p class="tooltip-label">
        Week ${hoveredItem.week} in 2025<br />
        ${hoveredItem.firstDayOfWeekCurrent
          ? `(starts ${formattedDayCurrent})`
          : ""}
      </p>
      <p class="tooltip-value">
        ${hoveredItem.valueCurrent
          ? valueFormatting[hoveredItem.variable](hoveredItem.valueCurrent, 2)
          : "-"}
      </p>
    </div>

    <div style="border-top: 1px solid #D9D9D9; width: 100%;" />

    <div>
      <p class="tooltip-label">
        Week ${hoveredItem.week} in 2024<br />${hoveredItem.firstDayOfWeekPrev
          ? `(starts ${formattedDayPrev})`
          : ""}
      </p>
      <p class="tooltip-value">
        ${hoveredItem.valuePrev
          ? valueFormatting[hoveredItem.variable](hoveredItem.valuePrev, 2)
          : "-"}
      </p>
    </div>
  </div>`;
}
