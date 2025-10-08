import { html } from "./utils/preact-htm.js";
import { getVerticalFromVerticalValue } from "./verticals.js";

export default function NoDataElement({ width, height, vertical }) {
  const verticalItem = getVerticalFromVerticalValue(vertical);
  return html`<div style="position: relative;">
    <svg
      viewBox="0 0 ${width} ${height}"
      style="width: 100%; height: 100%; background-color: #F7F7F7;"
    ></svg>
    <p
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);font-size: 14px; text-align: center; color: #000; width: 100%;"
    >
      No sufficient data for ${verticalItem?.label || vertical} in selected
      country and operating system.<br /><br />Click${" "}
      <a
        style="color: #000; text-decoration: underline; cursor: pointer;font-size: 14px; font-weight: 700;"
        onclick="${() => {
          document.dispatchEvent(
            new CustomEvent("vertical-selector-set-externally", {
              detail: {
                selectedCategory: verticalItem?.type.toLowerCase() || "gaming",
                selectedVertical: "all",
              },
            })
          );
        }}"
      >
        here</a
      >${" "} to view all ${verticalItem?.type || "Gaming or Consumer"} data.
    </p>
  </div>`;
}
