import { html } from "./utils/preact-htm.js";
import { ASSETS_URL } from "./helpers.js";

export default function Loader({ isLoading, y }) {
  if (!isLoading) return null;
  return html`<div class="loader-overlay" style="top: ${y}px;">
    <img src="${ASSETS_URL}/loader_100x.gif" alt="Loading..." />
  </div>`;
}
