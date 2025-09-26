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
    WW: "Worldwide",
  };
  const countriesArray = countries.map((country) => ({
    value: country,
    text: countryLabels[country] || country,
  }));

  const countryDefault = { value: "USA", text: "U.S." };

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

export function populateSystemSelector(containerId) {
  let systemDropdown = document.querySelector(`#${containerId}`);

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

  if (systemDropdown) {
    if (systemDropdown) systemDropdown.innerHTML = "";
    systemsArray.forEach((system) => {
      let option = document.createElement("option");
      option.text = system.text;
      option.value = system.value;
      systemDropdown.add(option);
    });
    systemDropdown.value = systemDefault.value;
    systemDropdown.addEventListener("change", (e) => {
      // Dispatch custom event to notify other components
      document.dispatchEvent(
        new CustomEvent(containerId + "-changed", {
          detail: { selectedSystem: e.target.value },
        })
      );
    });
  }
}

export function getDropdownValue(id = "") {
  // find out selected value of dropdown with id
  const dropdown = document.querySelector(`#${id}`);
  return dropdown ? dropdown.value : null;
}
