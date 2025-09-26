export const valueFormatting = {
  dau: (value) => {
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
