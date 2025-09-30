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
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(0).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(0).replace(/\.0$/, "") + "k"
      : value;
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
