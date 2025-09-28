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

export function renderUserElements() {
  console.log("Rendering user elements");

  // populate system selector
  populateSystemSelector("vis-user-dropdown-systems");

  // fetch data from google sheet
  fetchGoogleSheetCSV("user-engagement")
    .then((data) => {
      // format data
      handleData(data);

      // populate country selector
      const countries = Array.from(
        new Set(data.map((d) => d["country"]).filter((c) => c && c !== ""))
      ).sort();
      populateCountrySelector(countries, "vis-user-dropdown-countries");

      // render chart with data
      renderUserChart(data);
    })
    .catch((error) => {
      console.error("Error fetching sheet data (user engagement):", error);
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
      d["wau"] = +d["median_wau"];
      d["downloads"] = +d["total_downloads"];
      d["revenue"] = +d["total_revenue"];
      d["time_spent"] = +d["total_time_spent"].trim();
      d["week_start"] = d["week_start_date"];
      d["weekNumber"] = +d["Week Number"].trim();
    });
  }
}

function renderUserChart(data) {
  const containerId = "vis-user-container";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${UserChart} data=${data} />`, containerElement);
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function UserChart({ data }) {
  const [system, setSystem] = useState(
    getDropdownValue("vis-user-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-user-dropdown-countries")
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
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
  }, [system, country, vertical, category]);

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

  console.log(
    "Rendering user chart",
    chartData,
    system,
    country,
    category,
    vertical
  );

  const charts = [
    {
      title: "WAU",
      value: "wau",
      data: chartData.map((d) => ({ week_start: d.week_start, value: d.wau })),
    },
    {
      title: "Downloads",
      value: "downloads",
      data: chartData.map((d) => ({
        week_start: d.week_start,
        value: d.downloads,
      })),
    },
    {
      title: "Revenue",
      value: "revenue",
      data: chartData.map((d) => ({
        week_start: d.week_start,
        value: d.revenue,
      })),
    },
    {
      title: "Time spent",
      value: "time_spent",
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
    .scaleBand()
    .domain(weekNumberArray)
    .range([0, chartWidth]);
  console.log("weekScale domain:", weekScale.domain());

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

  return html`<div>
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; background-color: transparent"
    >
      <g>
        ${holidays.map((holiday, index) => {
          return html`<g transform="translate(${250 + index * 100}, 0)">
            <image
              href="${ASSETS_URL}${holiday.icon}"
              transform="translate(-14, 5)"
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
            />`
        )}
      </g>
    </svg>
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
}) {
  console.log(
    "Rendering single chart:",
    chart,
    datapointsPrev,
    datapointsCurrent
  );

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
      <line x1="0" y1="0" x2="0" y2="${dim.chartInnerHeight}" stroke="black" />
      <line
        x1="0"
        y1="${dim.chartInnerHeight}"
        x2="${dim.chartWidth}"
        y2="${dim.chartInnerHeight}"
        stroke="black"
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
      <text
        x="-10"
        y=${valueScale(0) - 8}
        class="charts-text-body"
        text-anchor="end"
        dominant-baseline="middle"
        >0</text
      >
      <text
        x="-10"
        y=${valueScale(maxValue) + 8}
        class="charts-text-body"
        text-anchor="end"
        dominant-baseline="middle"
        >${valueFormatting[chart.value](maxValue)}</text
      >
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
