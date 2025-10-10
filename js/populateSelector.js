export function populateCountrySelector(countries, containerId) {
  let countryDropdown = document.querySelector(`#${containerId}`);

  const countryLabels = {
    USA: "U.S.",
    CAN: "Canada",
    GBR: "U.K.",
    DEU: "Germany",
    FRA: "France",
    AUS: "Australia",
    IND: "India",
    ITA: "Italy",
    JPN: "Japan",
    KOR: "South Korea",
    WW: "Global",
  };
  const countriesArray = countries.map((country) => ({
    value: country,
    text: countryLabels[country] || country,
  }));

  const countryDefault = { value: "WW", text: "Global" };

  if (countryDropdown) {
    if (countryDropdown) countryDropdown.innerHTML = "";
    countriesArray
      .sort((a, b) => a.text.localeCompare(b.text))
      .forEach((country) => {
        let option = document.createElement("option");
        option.value = country.value;
        option.text = country.text;
        countryDropdown.add(option);
      });
    countryDropdown.value = countryDefault.value;
    countryDropdown.addEventListener("change", (e) => {
      // Dispatch custom event to notify other components
      document.dispatchEvent(
        new CustomEvent(containerId + "-changed", {
          detail: { selectedCountry: e.target.value },
        })
      );
    });
  }
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
