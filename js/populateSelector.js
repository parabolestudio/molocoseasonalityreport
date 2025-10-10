export function populateAllCountrySelectors() {
  let countryDropdowns = document.querySelectorAll(`.vis-dropdown-countries`);

  const countryLabels = {
    CAN: "Canada",
    FRA: "France",
    DEU: "Germany",
    WW: "Global",
    IND: "India",
    JPN: "Japan",
    KOR: "South Korea",
    GBR: "U.K.",
    USA: "U.S.",
  };
  const countries = [
    "WW",
    "USA",
    "IND",
    "JPN",
    "KOR",
    "GBR",
    "FRA",
    "DEU",
    "CAN",
  ];
  const countriesArray = countries
    .map((country) => ({
      value: country,
      text: countryLabels[country] || country,
    }))
    .sort((a, b) => a.text.localeCompare(b.text));

  const countryDefault = { value: "WW", text: "Global" };

  if (countryDropdowns)
    countryDropdowns.forEach((dropdown) => {
      if (dropdown) dropdown.innerHTML = "";
      countriesArray.forEach((country) => {
        let option = document.createElement("option");
        option.value = country.value;
        option.text = country.text;
        dropdown.add(option);
      });
      dropdown.value = countryDefault.value;
      dropdown.addEventListener("change", (e) => {
        // Dispatch custom event to notify other components
        document.dispatchEvent(
          new CustomEvent("vis-dropdown-countries-changed", {
            detail: { selectedCountry: e.target.value },
          })
        );
        // loop over all other dropdowns and set their value to the same
        countryDropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            otherDropdown.value = e.target.value;
          }
        });
      });
    });
}

export function populateAllSystemSelectors() {
  const systemDropdowns = document.querySelectorAll(".vis-dropdown-systems");

  const systemsArray = [
    {
      value: "IOS",
      text: "iOS",
    },
    {
      value: "ANDROID",
      text: "Android",
    },
  ];
  const systemDefault = systemsArray[0];

  if (systemDropdowns) {
    systemDropdowns.forEach((dropdown) => {
      if (dropdown) dropdown.innerHTML = "";
      systemsArray.forEach((system) => {
        let option = document.createElement("option");
        option.text = system.text;
        option.value = system.value;
        dropdown.add(option);
      });
      dropdown.value = systemDefault.value;
      dropdown.addEventListener("change", (e) => {
        document.dispatchEvent(
          new CustomEvent("vis-dropdown-systems-changed", {
            detail: { selectedSystem: e.target.value },
          })
        );
        // loop over all other dropdowns and set their value to the same
        systemDropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            otherDropdown.value = e.target.value;
          }
        });
      });
    });
  }
}

export function getDropdownValue(id = "") {
  // find out selected value of dropdown with id
  const dropdown = document.querySelector(`#${id}`);
  return dropdown ? dropdown.value : null;
}
