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

export function renderUserBehaviorElements() {
  console.log("Rendering user behavior elements");

  // populate system selector
  populateSystemSelector("vis-user-dropdown-systems");

  // render chart legend
  // TODO: implement legend rendering from RMG, done in Webflow?

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
    });
  }
}

function renderUserChart(data) {
  const containerElement = document.getElementById("vis-user-container");
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render chart as a component so hooks work
    renderComponent(html`<${UserChart} data=${data} />`, containerElement);
  } else {
    console.error(
      `Could not find container element for creative format with id ${containerId}`
    );
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

  return html`<div>User behavior chart goes here</div>`;
}
