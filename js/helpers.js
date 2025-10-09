export const ASSETS_URL =
  "https://raw.githubusercontent.com/parabolestudio/molocoseasonalityreport/refs/heads/main/assets/icons/";

export const valueFormatting = {
  wau: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(0).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(0).replace(/\.0$/, "") + "k"
      : value;
  },
  downloads: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(0).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(0).replace(/\.0$/, "") + "k"
      : value;
  },
  revenue: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(0).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(0).replace(/\.0$/, "") + "k"
      : value;
  },
  time_spent: (value) => {
    const absValue = Math.abs(value);
    let formatted =
      absValue >= 1_000_000_000
        ? (absValue / 1_000_000_000).toFixed(0).replace(/\.0$/, "") + "B"
        : absValue >= 1_000_000
        ? (absValue / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M"
        : absValue >= 1_000
        ? (absValue / 1_000).toFixed(0).replace(/\.0$/, "") + "k"
        : absValue;
    return value < 0 ? "-" + formatted : formatted;
  },
  wow: (value) => {
    const percent = value * 100;
    return percent > 0
      ? "+" + percent.toFixed(1).replace(/\.0$/, "") + "%"
      : percent < 0
      ? percent.toFixed(1).replace(/\.0$/, "") + "%"
      : "0%";
  },
  indexed: (value) => {
    return value.toFixed(0);
  },
};

// time scales
const prevYear = new Date().getFullYear() - 1;
const currentYear = new Date().getFullYear();

// Create a time scale from Oct 1 to end of March the following year (month is zero-based)
export const prevTimeScaleUTC = d3
  .scaleLinear()
  .domain([Date.UTC(prevYear, 8, 30), Date.UTC(currentYear, 2, 31)]);

export const currentTimeScaleUTC = d3
  .scaleLinear()
  .domain([Date.UTC(currentYear, 8, 30), Date.UTC(currentYear + 1, 2, 31)]);

export function getDateInUTC(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const dateUTC = Date.UTC(year, month - 1, day); // month is 0-based
  return dateUTC;
}
export const isMobile = window.innerWidth <= 480;
export const isTablet = window.innerWidth <= 800;

// Function to find intersection points between consecutive data points
export function findIntersection(p1, p2) {
  const x1 = p1.x,
    y1_user = p1.userY,
    y1_adv = p1.advertiserY;
  const x2 = p2.x,
    y2_user = p2.userY,
    y2_adv = p2.advertiserY;

  // Check if lines cross between these two points
  const userAboveAtP1 = y1_user < y1_adv;
  const userAboveAtP2 = y2_user < y2_adv;

  if (userAboveAtP1 === userAboveAtP2) {
    return null; // No intersection
  }

  // Calculate intersection point
  const userSlope = (y2_user - y1_user) / (x2 - x1);
  const advSlope = (y2_adv - y1_adv) / (x2 - x1);
  const userIntercept = y1_user - userSlope * x1;
  const advIntercept = y1_adv - advSlope * x1;

  if (Math.abs(userSlope - advSlope) < 1e-10) {
    return null; // Lines are parallel
  }

  const intersectionX = (advIntercept - userIntercept) / (userSlope - advSlope);
  const intersectionY = userSlope * intersectionX + userIntercept;

  return {
    x: intersectionX,
    y: intersectionY,
    weekNumber: null, // This is an intersection point, not tied to a specific week
  };
}

// Function to create area segments with proper intersection handling
export function createAreaSegments(alignedData) {
  // Create all points including intersections, properly sorted
  const allPoints = [];

  // Add all original data points
  alignedData.forEach((point) => {
    allPoints.push({
      ...point,
      isIntersection: false,
    });
  });

  // Find and add intersection points
  for (let i = 0; i < alignedData.length - 1; i++) {
    const p1 = alignedData[i];
    const p2 = alignedData[i + 1];

    const userAboveAtP1 = p1.userY < p1.advertiserY;
    const userAboveAtP2 = p2.userY < p2.advertiserY;

    // Check if lines cross between these points
    if (userAboveAtP1 !== userAboveAtP2) {
      const intersection = findIntersection(p1, p2);

      if (
        intersection &&
        intersection.x >= Math.min(p1.x, p2.x) &&
        intersection.x <= Math.max(p1.x, p2.x)
      ) {
        allPoints.push({
          weekNumber: null,
          x: intersection.x,
          userY: intersection.y,
          advertiserY: intersection.y,
          userValue: null,
          advertiserValue: null,
          weekStart: null,
          isIntersection: true,
        });
      }
    }
  }

  // Sort all points by x position
  allPoints.sort((a, b) => a.x - b.x);

  // Build segments with proper intersection handling
  let userAboveSegments = [];
  let userBelowSegments = [];

  if (allPoints.length >= 2) {
    let currentSegment = [];
    let currentUserAbove = null;

    for (let i = 0; i < allPoints.length; i++) {
      const point = allPoints[i];

      // Determine if user is above (for non-intersection points)
      let userAbove;
      if (point.isIntersection) {
        // At intersection, use the state that will apply after this point
        userAbove = currentUserAbove;
      } else {
        userAbove = point.userY < point.advertiserY;
      }

      if (currentUserAbove === null) {
        // First point
        currentUserAbove = userAbove;
        currentSegment = [point];
      } else if (point.isIntersection) {
        // Add intersection point to current segment and finish it
        currentSegment.push(point);

        if (currentSegment.length >= 2) {
          if (currentUserAbove) {
            userAboveSegments.push([...currentSegment]);
          } else {
            userBelowSegments.push([...currentSegment]);
          }
        }

        // Start new segment with intersection point
        currentSegment = [point];
        currentUserAbove = !currentUserAbove; // Flip state at intersection
      } else if (userAbove === currentUserAbove) {
        // Same state, add to current segment
        currentSegment.push(point);
      } else {
        // This shouldn't happen if intersections are calculated correctly
        // But handle it just in case
        if (currentSegment.length >= 2) {
          if (currentUserAbove) {
            userAboveSegments.push([...currentSegment]);
          } else {
            userBelowSegments.push([...currentSegment]);
          }
        }
        currentSegment = [point];
        currentUserAbove = userAbove;
      }
    }

    // Add final segment
    if (currentSegment.length >= 2) {
      if (currentUserAbove) {
        userAboveSegments.push(currentSegment);
      } else {
        userBelowSegments.push(currentSegment);
      }
    }
  }

  return { userAboveSegments, userBelowSegments };
}

export const monthsTwoYears = [
  {
    name: "October",
    shortName: "Oct",
    begin: "2024-10-01",
    end: "2024-10-31",
    year: "past",
  },
  {
    name: "November",
    shortName: "Nov",
    begin: "2024-11-01",
    end: "2024-11-30",
    year: "past",
  },
  {
    name: "December",
    shortName: "Dec",
    begin: "2024-12-01",
    end: "2024-12-31",
    year: "past",
  },
  {
    name: "January",
    shortName: "Jan",
    begin: "2025-01-01",
    end: "2025-01-31",
    year: "past",
  },
  {
    name: "February",
    shortName: "Feb",
    begin: "2025-02-01",
    end: "2025-02-28",
    year: "past",
  },
  {
    name: "March",
    shortName: "Mar",
    begin: "2025-03-01",
    end: "2025-03-31",
    year: "past",
  },
  {
    name: "October",
    shortName: "Oct",
    begin: "2025-10-01",
    end: "2025-10-31",
    year: "current",
  },
  {
    name: "November",
    shortName: "Nov",
    begin: "2025-11-01",
    end: "2025-11-30",
    year: "current",
  },
  {
    name: "December",
    shortName: "Dec",
    begin: "2025-12-01",
    end: "2025-12-31",
    year: "current",
  },
  {
    name: "January",
    shortName: "Jan",
    begin: "2026-01-01",
    end: "2026-01-31",
    year: "current",
  },
  {
    name: "February",
    shortName: "Feb",
    begin: "2026-02-01",
    end: "2026-02-28",
    year: "current",
  },
  {
    name: "March",
    shortName: "Mar",
    begin: "2026-03-01",
    end: "2026-03-31",
    year: "current",
  },
];

export const monthsPastYear = monthsTwoYears.filter((m) => m.year === "past");

export const periods = [
  {
    value: "all",
    title: "Show all",
    subtitle: {
      past: "October to March",
      current: "October to March",
    },
    icon: null,
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
    subtitle: {
      past: "October to November 24",
      current: "October to November 23",
    },
    icon: "halloween_white.svg",
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
    subtitle: {
      past: "November 25 to December 25",
      current: "November 24 to December 25",
    },
    icon: "christmas_white.svg",
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
    subtitle: {
      past: "December 26 to March",
      current: "December 25 to March",
    },
    icon: "new-year_white.svg",
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

// Precalculate positions and offsets for all holidays
import { holidays } from "./holidays.js";
export function getPrecalculatedHolidayPositions(
  timeScale,
  year,
  margin,
  width
) {
  const holidayPositions = holidays
    .map((holiday, index) => {
      const x = timeScale(getDateInUTC(holiday.date[year])) + margin.left;
      if (isNaN(x) || x < margin.left || x > width - margin.right) return null;
      return { holiday, index, x };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.x - b.x);

  // Calculate offsets based on proximity to previous holidays (including their offsets)
  holidayPositions.forEach((item, i) => {
    let offsetX = 0;
    let offsetY = 5;
    if (i > 0 && !isMobile && !isTablet) {
      const prevItem = holidayPositions[i - 1];
      const prevFinalX = prevItem.x + prevItem.offsetX; // Consider previous holiday's final position
      if (item.x - prevFinalX < 35) {
        offsetX = 35;
      }
    }
    if ((isMobile || isTablet) && i % 2 === 1) {
      offsetY = 30;
    }
    if (item.holiday.name === "New Year" && (isMobile || isTablet)) {
      offsetX = 10;
      offsetY = 12;
    }
    if (item.holiday.name === "Valentine's day" && (isMobile || isTablet)) {
      offsetX = 0;
      offsetY = 30;
    }

    item.offsetX = offsetX;
    item.offsetY = offsetY;
  });

  return holidayPositions;
}

export const holidayStyles = {
  line: {
    stroke: "#D5D5D5",
    "stroke-width": "1",
    "stroke-dasharray": "",
  },
};

export const metricsLabels = {
  cpm_p50: "Cost per mile (thousand) impressions",
  cpi_p50: "Cost per install",
  roas_d7_p50: "Return on Ad Spend (D7)",
  arppu_d7_p50: "Average Revenue Per Paying User (D7)",
  ad_opportunities: "Total bid requests across all supply inventory",
};
