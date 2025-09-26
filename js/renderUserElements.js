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
      d["category"] = d["category"];
      d["vertical"] = d["vertical"];
      d["dau"] = +d["total_dau"];
      d["downloads"] = +d["total_downloads"];
      d["revenue"] = +d["total_revenue"];
      d["time_spent"] = +d["total_time_spent"].trim();
      d["week_start"] = d["week_start_date"];
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
  const [chartData, setChartData] = useState(filterData(data));

  function filterData(inputData) {
    return inputData.filter(
      (d) => d.system === system && d.country === country
    );
  }
  useEffect(() => {
    setChartData(filterData(data));
  }, [system, country]);

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

  console.log("Rendering user chart with data:", chartData);

  const charts = [
    {
      title: "WAU",
      value: "wau",
      data: chartData.map((d) => ({ date: d.week_start, value: d.wau })),
    },
    {
      title: "Downloads",
      value: "downloads",
      data: chartData.map((d) => ({ date: d.week_start, value: d.downloads })),
    },
    {
      title: "Revenue",
      value: "revenue",
      data: chartData.map((d) => ({ date: d.week_start, value: d.revenue })),
    },
    {
      title: "Time spent",
      value: "time_spent",
      data: chartData.map((d) => ({ date: d.week_start, value: d.time_spent })),
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

  return html`<div>
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; background-color: transparent"
    >
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
            />`
        )}
      </g>
    </svg>
  </div>`;
}
function SingleChart({ chart, index, dimensions: dim }) {
  console.log("Rendering single chart:", chart);

  const maxValue = d3.max(chart.data, (d) => d.value);
  const valueScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([dim.chartInnerHeight, 0]);

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
