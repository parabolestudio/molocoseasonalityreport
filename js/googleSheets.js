// fetch data from a public Google sheet without the API directly from the URL
export async function fetchGoogleSheetCSV(tabName) {
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

const SHEET_ID =
  "2PACX-1vQV_fJ4xrBe0Wvwmk92stpzuxnCUxpmm5l7wz-HJ-N0DzRH0tyT2gS8SEQs0mNef3k8aImO2NVwyiS7";

const SHEET_TAB_IDS = {
  "user-engagement": "2041233709",
  "advertiser-kpis": "367086481",
};

function getSheetUrl(tabName) {
  const gid = SHEET_TAB_IDS[tabName];
  if (!gid) {
    throw new Error(`No GID found for tab name: ${tabName}`);
  }
  return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${gid}&single=true&output=csv`;
}
