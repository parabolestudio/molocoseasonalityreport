import { html } from "./utils/preact-htm.js";

export default function TooltipHoliday({ hoveredItem }) {
  if (!hoveredItem) return null;

  return html`<div
    class="tooltip"
    style="left: ${hoveredItem.tooltipX}px; ${hoveredItem.align}: ${hoveredItem.tooltipY}px; ${hoveredItem.align ===
    "bottom"
      ? "top: unset;"
      : ""}"
  >
    <div>
      <p class="tooltip-title">${hoveredItem.name}</p>
      <p class="tooltip-label">${hoveredItem.date}</p>
    </div>
  </div>`;
}
