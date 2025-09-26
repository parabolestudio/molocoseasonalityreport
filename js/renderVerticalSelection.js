import { html, renderComponent, useState } from "./utils/preact-htm.js";

const containerId = "vis-vertical-filter";

export function renderVerticalSelection() {
  console.log("Rendering vertical selection");
  let containerElement = document.querySelector(`#${containerId}`);

  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // Render ButtonGroup as a component so hooks work
    renderComponent(html`<${VerticalSelector} />`, containerElement);
  } else {
    console.error(
      `Could not find container element for vertical selection with id ${containerId}`
    );
  }
}

function VerticalSelector() {
  const [vertical, setVertical] = useState("gaming");

  function handleVerticalChange(newVertical) {
    setVertical(newVertical);
    // Dispatch custom event to notify other components
    document.dispatchEvent(
      new CustomEvent(`${containerId}-changed`, {
        detail: { selectedButton: newVertical },
      })
    );
  }

  function handleSelectorClick(vertical) {
    console.log("Clicked vertical:", vertical);
  }

  return html`<div class="vis-filter-container">
    <div
      class=${`vis-filter-item ${vertical === "gaming" ? "selected" : ""}`}
      onclick=${() => handleVerticalChange("gaming")}
    >
      <p class="charts-text-big-bold">Gaming</p>
      <svg
        width="23"
        height="22"
        viewBox="0 0 23 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onclick=${() => handleSelectorClick("gaming")}
      >
        <circle
          cx="11.9265"
          cy="11"
          r="11"
          fill="${vertical === "gaming" ? "white" : "#040078"}"
        />
        <path
          d="M7.23413 8.90234C7.34553 8.89042 7.45696 8.92688 7.54468 9.01758H7.54565L11.9421 13.04L16.3074 9.01758C16.3952 8.92652 16.5073 8.8904 16.6189 8.90234C16.73 8.91429 16.8347 8.97257 16.9148 9.05859C17.0046 9.15511 17.0345 9.28424 17.0242 9.40039C17.0141 9.51344 16.9637 9.62686 16.8748 9.70117L16.8757 9.70215L12.2107 14.002L12.2097 14.001C12.1763 14.0338 12.1287 14.0573 12.0896 14.0713C12.0452 14.0872 11.9915 14.0996 11.9431 14.0996C11.8947 14.0996 11.8415 14.088 11.7957 14.0732C11.7485 14.058 11.7016 14.0374 11.6628 14.0166L11.6511 14.0107L11.6423 14.002L6.97729 9.70215L6.97144 9.69727C6.8145 9.52852 6.75833 9.25203 6.93823 9.05859C7.01833 8.97257 7.12306 8.91429 7.23413 8.90234Z"
          stroke="${vertical === "gaming" ? "#040078" : "white"}"
          fill="${vertical === "gaming" ? "#040078" : "white"}"
          stroke-width="0.2"
        />
      </svg>
    </div>
    <div
      class=${`vis-filter-item ${vertical === "consumer" ? "selected" : ""}`}
      onclick=${() => handleVerticalChange("consumer")}
    >
      <p class="charts-text-big-bold">Consumer</p>
      <svg
        width="23"
        height="22"
        viewBox="0 0 23 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onclick=${() => handleSelectorClick("consumer")}
      >
        <circle
          cx="11.9265"
          cy="11"
          r="11"
          fill="${vertical === "consumer" ? "white" : "#040078"}"
        />
        <path
          d="M7.23413 8.90234C7.34553 8.89042 7.45696 8.92688 7.54468 9.01758H7.54565L11.9421 13.04L16.3074 9.01758C16.3952 8.92652 16.5073 8.8904 16.6189 8.90234C16.73 8.91429 16.8347 8.97257 16.9148 9.05859C17.0046 9.15511 17.0345 9.28424 17.0242 9.40039C17.0141 9.51344 16.9637 9.62686 16.8748 9.70117L16.8757 9.70215L12.2107 14.002L12.2097 14.001C12.1763 14.0338 12.1287 14.0573 12.0896 14.0713C12.0452 14.0872 11.9915 14.0996 11.9431 14.0996C11.8947 14.0996 11.8415 14.088 11.7957 14.0732C11.7485 14.058 11.7016 14.0374 11.6628 14.0166L11.6511 14.0107L11.6423 14.002L6.97729 9.70215L6.97144 9.69727C6.8145 9.52852 6.75833 9.25203 6.93823 9.05859C7.01833 8.97257 7.12306 8.91429 7.23413 8.90234Z"
          stroke="${vertical === "consumer" ? "#040078" : "white"}"
          fill="${vertical === "consumer" ? "#040078" : "white"}"
          stroke-width="0.2"
        />
      </svg>
    </div>
  </div>`;
}
