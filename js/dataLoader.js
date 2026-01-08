const SHEET_ID =
  "2PACX-1vTIHTQnmp5gELDxoqd-e70EzKMHIOiVYpdw-cl1wWp79fSR--V-s6trYXY97rUTrXsXBYP5VaNeVPoo";

const SHEET_TAB_IDS = {
  "user-engagement-merged": "734297840", // merged with non-indexed and indexed data
  "advertiser-kpis-merged": "337233485", // indexed data + bid requests
  "vertical-inclusion-merged": "1073630041", // tab for vertical inclusion iOS and Android
  "latest-data-update": "1752590836", // tab to show latest data update date
};

function getSheetUrl(tabName) {
  const gid = SHEET_TAB_IDS[tabName];
  if (!gid) {
    throw new Error(`No GID found for tab name: ${tabName}`);
  }
  return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${gid}&single=true&output=csv`;
}

// fetch data from a public Google sheet without the API directly from the URL
async function fetchGoogleSheetCSV(tabName) {
  const sheetUrl = getSheetUrl(tabName);
  const response = await fetch(sheetUrl);
  const csvText = await response.text();
  const lines = csvText.trim().split("\n");
  // Robust CSV parser for a single line
  function splitCSV(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current); // push last column
    return result;
  }
  const headers = splitCSV(lines[0]);
  const data = lines.slice(1).map((line) => {
    const values = splitCSV(line);
    const rowObj = {};
    headers.forEach((header, i) => {
      header = header.trim();
      let cellValue = values[i] || "";
      if (cellValue === "\r") {
        cellValue = "";
      }
      rowObj[header] = cellValue;
    });
    return rowObj;
  });
  return data;
}

async function fetchFileCSV(tabName) {
  const sheetId = SHEET_TAB_IDS[tabName];
  if (!sheetId) {
    throw new Error(`No sheet ID found for tab name: ${tabName}`);
  }
  return d3
    .csv(`https://www.moloco.com/seasonality-report/data/${sheetId}.csv`)
    .then((fetchedData) => {
      return fetchedData;
    });
}

export async function fetchCSV(tabName) {
  // for chinese version, fetch from local file, otherwise fetch from google sheet
  if (
    window.location.href.split("?")[0] ===
    "https://www.moloco.com/zh/seasonality"
  ) {
    return fetchFileCSV(tabName);
  }
  return fetchGoogleSheetCSV(tabName);
}
