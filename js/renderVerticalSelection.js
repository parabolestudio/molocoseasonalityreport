import {
  html,
  renderComponent,
  useState,
  useEffect,
} from "./utils/preact-htm.js";
import { gamingVerticals, consumerVerticals } from "./verticals.js";

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

const ASSETS_URL =
  "https://raw.githubusercontent.com/parabolestudio/molocoseasonalityreport/refs/heads/main/assets/icons/";

const categoryIcons = [
  {
    label: "Gaming",
    icon: "gaming.svg",
  },
  {
    label: "Consumer",
    icon: "consumer.svg",
  },
];

function VerticalSelector() {
  const [category, setCategory] = useState("gaming");
  const [vertical, setVertical] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const [svgCache, setSvgCache] = useState({});

  // Fetch and cache SVG content
  const fetchSvgContent = async (iconPath) => {
    if (svgCache[iconPath]) {
      return svgCache[iconPath];
    }
    try {
      const response = await fetch(ASSETS_URL + iconPath);
      const svgText = await response.text();
      setSvgCache((prev) => ({ ...prev, [iconPath]: svgText }));
      return svgText;
    } catch (error) {
      console.error("Error fetching SVG:", error);
      return null;
    }
  };

  // get vertical icons on mount
  useEffect(async () => {
    // Pre-fetch category SVG icons first
    const iconPathsCategories = categoryIcons.map((d) => d.icon);
    for (const iconPath of iconPathsCategories) {
      await fetchSvgContent(iconPath);
    }
    // Pre-fetch all SVG icons
    const allVerticals = [...gamingVerticals, ...consumerVerticals];
    const iconPaths = allVerticals.map((d) => d.icon);
    for (const iconPath of iconPaths) {
      await fetchSvgContent(iconPath);
    }
  }, []);

  function handleCategoryChange(newCategory) {
    if (newCategory !== category) {
      console.log("Changing category to:", newCategory);
      setCategory(newCategory);

      console.log("Resetting vertical to 'all'");
      setVertical("all");

      if (menuOpen) setMenuOpen(false);

      // Dispatch custom event to notify other components
      document.dispatchEvent(
        new CustomEvent(`${containerId}-category-changed`, {
          detail: { selectedCategory: newCategory },
        })
      );
      document.dispatchEvent(
        new CustomEvent(`${containerId}-vertical-changed`, {
          detail: { selectedVertical: "all" },
        })
      );
    }
  }

  function handleSelectorClick(e, selectorCategory) {
    e.stopPropagation();

    if (selectorCategory !== category) {
      handleCategoryChange(selectorCategory);
      setMenuOpen(true);
    } else {
      setMenuOpen(!menuOpen);
    }
  }

  const verticalSet =
    category === "gaming" ? gamingVerticals : consumerVerticals;
  const verticalItems = verticalSet.map((item) => {
    const svgContent = svgCache[item.icon];

    return html`<li
      class="vertical-item ${vertical === item.value ? "active" : "inactive"}"
      onClick="${() => {
        setVertical(item.value);
        setMenuOpen(false);

        // Dispatch custom event to notify other components
        document.dispatchEvent(
          new CustomEvent(`${containerId}-vertical-changed`, {
            detail: { selectedVertical: item.value },
          })
        );
      }}"
    >
      <div
        class="vertical-icon"
        dangerouslySetInnerHTML=${{ __html: svgContent || "" }}
      ></div>
      <span>${item.label}</span>
    </li>`;
  });

  console.log(
    "Rendering VerticalSelector with category:",
    category,
    "and vertical:",
    vertical
  );

  return html`<div class="vis-filter-container">
    <div class="vis-filter-category-container">
      <div
        class=${`vis-filter-item ${category === "gaming" ? "selected" : ""}`}
        onclick=${() => handleCategoryChange("gaming")}
      >
        <div
          class="category-icon"
          dangerouslySetInnerHTML=${{ __html: svgCache["gaming.svg"] || "" }}
        ></div>
        <p class="charts-text-big-bold">Gaming</p>
        <svg
          width="23"
          height="22"
          viewBox="0 0 23 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onclick=${(e) => handleSelectorClick(e, "gaming")}
          transform="rotate(${menuOpen && category === "gaming" ? 180 : 0})"
          style="transition: transform 0.3s ease;"
        >
          <circle
            cx="11.9265"
            cy="11"
            r="11"
            fill="${category === "gaming" ? "white" : "#040078"}"
          />
          <path
            d="M7.23413 8.90234C7.34553 8.89042 7.45696 8.92688 7.54468 9.01758H7.54565L11.9421 13.04L16.3074 9.01758C16.3952 8.92652 16.5073 8.8904 16.6189 8.90234C16.73 8.91429 16.8347 8.97257 16.9148 9.05859C17.0046 9.15511 17.0345 9.28424 17.0242 9.40039C17.0141 9.51344 16.9637 9.62686 16.8748 9.70117L16.8757 9.70215L12.2107 14.002L12.2097 14.001C12.1763 14.0338 12.1287 14.0573 12.0896 14.0713C12.0452 14.0872 11.9915 14.0996 11.9431 14.0996C11.8947 14.0996 11.8415 14.088 11.7957 14.0732C11.7485 14.058 11.7016 14.0374 11.6628 14.0166L11.6511 14.0107L11.6423 14.002L6.97729 9.70215L6.97144 9.69727C6.8145 9.52852 6.75833 9.25203 6.93823 9.05859C7.01833 8.97257 7.12306 8.91429 7.23413 8.90234Z"
            stroke="${category === "gaming" ? "#040078" : "white"}"
            fill="${category === "gaming" ? "#040078" : "white"}"
            stroke-width="0.2"
          />
        </svg>
      </div>
      <div
        class=${`vis-filter-item ${category === "consumer" ? "selected" : ""}`}
        onclick=${() => handleCategoryChange("consumer")}
      >
        <div
          class="category-icon"
          dangerouslySetInnerHTML=${{ __html: svgCache["consumer.svg"] || "" }}
        ></div>
        <p class="charts-text-big-bold">Consumer</p>
        <svg
          width="23"
          height="22"
          viewBox="0 0 23 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onclick=${(e) => handleSelectorClick(e, "consumer")}
          transform="rotate(${menuOpen && category === "consumer" ? 180 : 0})"
          style="transition: transform 0.3s ease;"
        >
          <circle
            cx="11.9265"
            cy="11"
            r="11"
            fill="${category === "consumer" ? "white" : "#040078"}"
          />
          <path
            d="M7.23413 8.90234C7.34553 8.89042 7.45696 8.92688 7.54468 9.01758H7.54565L11.9421 13.04L16.3074 9.01758C16.3952 8.92652 16.5073 8.8904 16.6189 8.90234C16.73 8.91429 16.8347 8.97257 16.9148 9.05859C17.0046 9.15511 17.0345 9.28424 17.0242 9.40039C17.0141 9.51344 16.9637 9.62686 16.8748 9.70117L16.8757 9.70215L12.2107 14.002L12.2097 14.001C12.1763 14.0338 12.1287 14.0573 12.0896 14.0713C12.0452 14.0872 11.9915 14.0996 11.9431 14.0996C11.8947 14.0996 11.8415 14.088 11.7957 14.0732C11.7485 14.058 11.7016 14.0374 11.6628 14.0166L11.6511 14.0107L11.6423 14.002L6.97729 9.70215L6.97144 9.69727C6.8145 9.52852 6.75833 9.25203 6.93823 9.05859C7.01833 8.97257 7.12306 8.91429 7.23413 8.90234Z"
            stroke="${category === "consumer" ? "#040078" : "white"}"
            fill="${category === "consumer" ? "#040078" : "white"}"
            stroke-width="0.2"
          />
        </svg>
      </div>
      ${menuOpen &&
      html` <div class="vis-filter-menu-container">
        <p>Select sub-vertical</p>
        <ul class="vertical-list">
          ${verticalItems}
        </ul>
      </div>`}
    </div>
  </div>`;
}
