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
  getDateInUTC,
  ASSETS_URL,
  isMobile,
  isTablet,
  createAreaSegments,
  monthsTwoYears,
  periods,
  getPrecalculatedHolidayPositions,
  holidayStyles,
  metricsLabels,
} from "./helpers.js";
import TooltipHoliday from "./TooltipHoliday.js";
import Loader from "./Loader.js";
import NoDataElement from "./NoDataElement.js";
import { holidayIcons } from "./holidays.js";

export function renderComparisonElements(
  userData,
  advertiserData,
  includedVerticalData
) {
  console.log(
    "Rendering comparison elements",
    userData,
    advertiserData,
    includedVerticalData
  );

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
  renderPeriodButtons("past");

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
    const countriesUser = Array.from(
      new Set(userData.map((d) => d["country"]).filter((c) => c && c !== ""))
    ).sort();
    const countriesAdvertiser = Array.from(
      new Set(
        advertiserData.map((d) => d["country"]).filter((c) => c && c !== "")
      )
    ).sort();

    // get only countries that are in both datasets
    const countriesUniqueMerged = countriesUser.filter((country) =>
      countriesAdvertiser.includes(country)
    );

    populateCountrySelector(
      countriesUniqueMerged,
      "vis-comparison-dropdown-countries"
    );

    // render chart with data
    renderComparisonChart(userData, advertiserData, includedVerticalData);
  } else {
    renderComparisonChart(null, null, null);
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

const userMetrics = [
  { value: "downloads_indexed", label: "Downloads" },
  { value: "revenue_indexed", label: "Revenue" },
  { value: "time_spent_indexed", label: "Time Spent" },
];
const userMetricDefault = userMetrics[0];

const advertiserMetrics = [
  { value: "ad_opportunities", label: "Ad opportunities" },
  { value: "cpm_p50", label: "CPM" },
  { value: "cpi_p50", label: "CPI" },
  { value: "roas_d7_p50", label: "ROAS" },
  { value: "arppu_d7_p50", label: "ARPPU" },
];
const advertiserMetricDefault = advertiserMetrics[0];

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
  const [hoveredMetricItem, setHoveredMetric] = useState(null);

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
          onmouseleave="${() => setHoveredMetric(null)}"
          onmouseenter="${(event) => {
            if (containerId !== "vis-comparison-advertiser-metrics") return;
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

    renderPeriodButtons(year);
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

function renderPeriodButtons(year) {
  const containerId = "vis-comparison-periods";
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    // clear existing content before rendering
    // containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(
      html`<${ComparisonPeriodButtons} year=${year} />`,
      containerElement
    );
  } else {
    console.error(`Could not find container element with id ${containerId}`);
  }
}

function ComparisonPeriodButtons({ year }) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

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
    // If subtitle contains "to", add a <br> after "to"
    let subtitle = btn.subtitle[year];
    if (subtitle.includes("to") && !isMobile) {
      subtitle = subtitle.replace(/\bto\b/, "to<br>");
    }
    return html`<div
      class="vis-period-button ${selectedPeriod === btn.value
        ? "selected"
        : ""} ${btn.icon ? "has-icon" : ""}"
      onclick=${() => handlePeriodChange(btn.value)}
    >
      ${btn.icon && selectedPeriod === btn.value
        ? html` <img src="${ASSETS_URL}/${btn.icon}" alt="${btn.icon} icon" />`
        : null}

      <div class="vis-period-button-text">
        <span class="vis-period-title">${btn.title}</span>
        ${(selectedPeriod === btn.value && isMobile) || !isMobile
          ? html`<span
              class="vis-period-subtitle"
              dangerouslySetInnerHTML=${{ __html: subtitle }}
            ></span>`
          : null}
      </div>
      ${!btn.icon && selectedPeriod === btn.value
        ? html` <div style="width: 35px; height: 35px;"></div>`
        : null}
    </div>`;
  });

  return html`<div class="vis-period-buttons-container">${buttons}</div>`;
}

function renderComparisonChart(userData, advertiserData, includedVerticalData) {
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
        includedVerticalData=${includedVerticalData}
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

function ComparisonChart({ userData, advertiserData, includedVerticalData }) {
  const [system, setSystem] = useState(
    getDropdownValue("vis-comparison-dropdown-systems")
  );
  const [country, setCountry] = useState(
    getDropdownValue("vis-comparison-dropdown-countries") || "USA"
  );
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [year, setYear] = useState("past");
  const [period, setPeriod] = useState("all");
  const [userMetric, setUserMetric] = useState(userMetricDefault.value);
  const [advertiserMetric, setAdvertiserMetric] = useState(
    advertiserMetricDefault.value
  );
  const [hoveredHoliday, setHoveredHoliday] = useState(null);
  const [hoveredValues, setHoveredValues] = useState(null);

  const [chartUserData, setChartUserData] = useState(
    filterData(userData, includedVerticalData)
  );
  const [chartAdvertiserData, setChartAdvertiserData] = useState(
    filterData(advertiserData, includedVerticalData)
  );

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
    setChartUserData(filterData(userData, includedVerticalData));
    setChartAdvertiserData(filterData(advertiserData, includedVerticalData));
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
    includedVerticalData,
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
  const height = isMobile ? 400 : 600;
  const margin = { top: 60, right: 1, bottom: 60, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (
    chartUserData &&
    chartUserData.length === 0 &&
    chartAdvertiserData &&
    chartAdvertiserData.length === 0
  ) {
    return html`<${NoDataElement}
      width=${width}
      height=${height}
      vertical=${vertical}
    />`;
  }

  // months display
  const displayMonths = monthsTwoYears
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
    ? chartUserData
        .filter((d) => {
          const date = getDateInUTC(d.week_start);
          return date >= timeScale.domain()[0] && date <= timeScale.domain()[1];
        })
        .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start))
    : [];

  const datapointsAdvertiser = chartAdvertiserData
    ? chartAdvertiserData
        .filter((d) => {
          const date = getDateInUTC(d.week_start);
          return date >= timeScale.domain()[0] && date <= timeScale.domain()[1];
        })
        .sort((a, b) => getDateInUTC(a.week_start) - getDateInUTC(b.week_start))
    : [];

  const minUserValue = datapointsUser
    ? d3.min(datapointsUser, (d) => d[userMetric])
    : 0;
  const maxUserValue = datapointsUser
    ? d3.max(datapointsUser, (d) => d[userMetric])
    : 0;
  const minAdvertiserValue = datapointsAdvertiser
    ? d3.min(datapointsAdvertiser, (d) => d[advertiserMetric])
    : 0;
  const maxAdvertiserValue = datapointsAdvertiser
    ? d3.max(datapointsAdvertiser, (d) => d[advertiserMetric])
    : 0;
  const minComparisonValue = Math.min(minUserValue, minAdvertiserValue);
  const maxComparisonValue = Math.max(maxUserValue, maxAdvertiserValue);
  const valueComparisonScale = d3
    .scaleLinear()
    .domain([minComparisonValue, maxComparisonValue])
    .range([innerHeight, 0])
    .nice();

  const lineUserGen = d3
    .line()
    .y((d) => valueComparisonScale(d[userMetric]))
    .x((d) => weekScale(d.weekNumber))
    .defined((d) => d[userMetric] !== null);

  const lineAdvertiserGen = d3
    .line()
    .y((d) => valueComparisonScale(d[advertiserMetric]))
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

  // Create area between the two lines - fix sorting issue with week numbers
  const alignedData = [];

  // Get all unique weeks and their corresponding dates for proper sorting
  const allWeeksWithDates = [];

  [...datapointsUser, ...datapointsAdvertiser].forEach((d) => {
    if (!allWeeksWithDates.find((item) => item.weekNumber === d.weekNumber)) {
      allWeeksWithDates.push({
        weekNumber: d.weekNumber,
        weekStart: d.week_start,
        date: getDateInUTC(d.week_start),
      });
    }
  });

  // Sort by actual date, not week number
  allWeeksWithDates.sort((a, b) => a.date - b.date);

  allWeeksWithDates.forEach(({ weekNumber }) => {
    const userPoint = datapointsUser.find((d) => d.weekNumber === weekNumber);
    const advertiserPoint = datapointsAdvertiser.find(
      (d) => d.weekNumber === weekNumber
    );

    if (
      userPoint &&
      advertiserPoint &&
      userPoint[userMetric] !== null &&
      advertiserPoint[advertiserMetric] !== null
    ) {
      alignedData.push({
        weekNumber: weekNumber,
        x: weekScale(weekNumber),
        userY: valueComparisonScale(userPoint[userMetric]),
        advertiserY: valueComparisonScale(advertiserPoint[advertiserMetric]),
        userValue: userPoint[userMetric],
        advertiserValue: advertiserPoint[advertiserMetric],
        weekStart: userPoint.week_start,
      });
    }
  });

  const { userAboveSegments, userBelowSegments } =
    createAreaSegments(alignedData);

  const areaGen = d3
    .area()
    .x((d) => d.x)
    .y0((d) => d.userY)
    .y1((d) => d.advertiserY);

  const holidayPositions = getPrecalculatedHolidayPositions(
    timeScale,
    year,
    margin,
    width
  );

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
        if (datapointsUser.length === 0 && datapointsAdvertiser.length === 0)
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
          const datapointAdvertiser =
            datapointsAdvertiser && datapointsAdvertiser.length > 0
              ? datapointsAdvertiser.find((d) => d.weekNumber === hoveredWeek)
              : [];

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
            userValue: datapointUser[userMetric] || null,
            advertiserValue:
              datapointAdvertiser && datapointAdvertiser[advertiserMetric]
                ? datapointAdvertiser[advertiserMetric]
                : null,
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
        ${minComparisonValue &&
        maxComparisonValue &&
        valueComparisonScale &&
        html`
          <g class="y-axis">
            ${valueComparisonScale.domain()[1] - 5 > 100
              ? html` <text
                  x="${0 - 5}"
                  y="${valueComparisonScale(valueComparisonScale.domain()[1])}"
                  text-anchor="end"
                  dominant-baseline="middle"
                  class="charts-text-body"
                  font-size="14"
                  font-weight="400"
                  font-family="Montserrat, sans-serif"
                  style="line-height: 1.25"
                >
                  ${valueComparisonScale.domain()[1]}
                </text>`
              : ""}
            <line
              x1="0"
              x2="${innerWidth}"
              y1="${valueComparisonScale(100)}"
              y2="${valueComparisonScale(100)}"
              stroke="#D5D5D5"
            />
            <text
              x="${0 - 5}"
              y="${valueComparisonScale(100)}"
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
              y="${valueComparisonScale(valueComparisonScale.domain()[0])}"
              text-anchor="end"
              dominant-baseline="middle"
              class="charts-text-body"
              font-size="14"
              font-weight="400"
              font-family="Montserrat, sans-serif"
              style="line-height: 1.25"
            >
              ${valueComparisonScale.domain()[0]}
            </text>
          </g>
        `}
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
                font-size="14"
                font-weight="400"
                font-family="Montserrat, sans-serif"
                style="line-height: 1.25"
                fill-opacity="${xEnd - xBegin < 30 ? 0 : 1}"
              >
                ${isMobile ? month.shortName : month.name}
              </text>
            </g>`;
          })}
        </g>
        <!-- Area between the two lines with different shading -->
        ${userAboveSegments.map(
          (segment) => html`
            <path
              d="${areaGen(segment)}"
              fill="rgba(96, 226, 183, 0.2)"
              style="transition: all ease 0.3s"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          `
        )}
        ${userBelowSegments.map(
          (segment) => html`
            <path
              d="${areaGen(segment)}"
              fill="rgba(135, 106, 255, 0.2)"
              style="transition: all ease 0.3s"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          `
        )}

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
              cy="${valueComparisonScale(
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
              cy="${valueComparisonScale(
                highlightAdvertiser ? highlightAdvertiser[advertiserMetric] : 0
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
    <${Loader}
      isLoading=${chartUserData === null || chartAdvertiserData === null}
      y=${innerHeight / 2 + 50}
    />
  </div>`;
}

function TooltipValues({ hoveredItem }) {
  if (!hoveredItem) return null;

  const formattedDay = hoveredItem.firstDayOfWeek
    ? d3.utcFormat("%b %d, %Y")(getDateInUTC(hoveredItem.firstDayOfWeek))
    : null;

  return html`<div
    class="tooltip"
    style="left: ${hoveredItem.tooltipX}px; top: ${hoveredItem.tooltipY}px;"
  >
    <p class="tooltip-title">Week of ${formattedDay}</p>

    <div>
      <p class="tooltip-label">${hoveredItem.userVariable}, indexed</p>
      <p class="tooltip-value">
        ${hoveredItem.userValue
          ? valueFormatting.indexed(hoveredItem.userValue)
          : "-"}
      </p>
    </div>

    <div style="border-top: 1px solid #D9D9D9; width: 100%;" />

    <div>
      <p class="tooltip-label">${hoveredItem.advertiserVariable}, indexed</p>
      <p class="tooltip-value">
        ${hoveredItem.advertiserValue
          ? valueFormatting.indexed(hoveredItem.advertiserValue)
          : "-"}
      </p>
    </div>
  </div>`;
}
