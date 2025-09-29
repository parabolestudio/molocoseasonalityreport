export const ASSETS_URL =
  "https://raw.githubusercontent.com/parabolestudio/molocoseasonalityreport/refs/heads/main/assets/icons/";

export const valueFormatting = {
  wau: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k"
      : value;
  },
  downloads: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k"
      : value;
  },
  revenue: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k"
      : value;
  },
  time_spent: (value) => {
    return value >= 1_000_000_000
      ? (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
      : value >= 1_000_000
      ? (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      : value >= 1_000
      ? (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k"
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
