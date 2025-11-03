// bilibili.js

// Define the sections and their respective CSS selectors
const sections = {
  bilibiliHome: [
    ".bili-feed4-layout",
    ".header-channel-fixed",
    ".bili-footer",
    ".international-footer",
  ],
  bilibiliSidebar: [
    "#reco_list",
    "#right-bottom-banner",
    "#live_recommand_report",
    ".pop-live-small-mode",
    "#danmukuBox",
    ".video-card-ad-small",
    ".recommend-list-v1",
    ".ad-report",
    ".ad-floor-exp",
  ],
  bilibiliUpNext: [
    ".bpx-player-ending-content",
    ".bpx-player-ending-related",
    ".bilibili-player-ending-panel-box-videos",
  ],
  bilibiliComments: [
    "#comment",
    ".bili-footer",
    ".international-footer",
    "#activity_vote",
    ".inside-wrp",
    "#commentapp",
  ],
  bilibiliSubscription: [
    ".bili-dyn-list-tabs",
    ".bili-dyn-list",
    ".bili-footer",
    ".international-footer",
    ".bili-dyn-topic-box",
    ".bili-dyn-up-list",
  ],
  bilibiliTrending: [
    ".popular-container",
    ".popular-video-container",
    ".bili-footer",
    ".international-footer",
    // ".channel-link", // these 3 are the buttons in the header of hompage
    // ".channel-link__right",
    // ".channel-entry-more__link",
  ],
  bilibiliDanmuku: [".bpx-player-row-dm-wrap"],
  // NEW FEATURE 1: Video Thumbnails
  // TODO: Update these selectors to match actual Bilibili thumbnail elements
  bilibiliThumbnails: [
    ".bili-video-card__image", // Common video thumbnail class
    ".video-card__cover", // Video card cover
    ".pic-box", // Picture box
    ".bili-live-card__cover", // Live card cover
    "img.cover", // Generic cover images
    ".van-image", // Van image component
    // Add more selectors as needed - you can update these later
  ],
};

// Apply existing settings to the current tab
chrome.storage.sync.get(
  ["bilibiliSettings", "extensionEnabled"],
  function (result) {
    const settings = result.bilibiliSettings || {};
    const extensionEnabled =
      result.extensionEnabled !== undefined ? result.extensionEnabled : true; // Default to enabled

    console.log("Initial load - Extension enabled:", extensionEnabled);
    console.log("Initial load - Settings:", settings);

    if (extensionEnabled) {
      applySettings(settings);
    } else {
      // If disabled, remove all CSS to show everything normally
      removeAllStyles();
    }
  }
);

// Listen for messages from the popup to apply settings
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Content script received message:", request);
  if (request.action === "applySettings") {
    const settings = request.settings;
    const extensionEnabled =
      request.extensionEnabled !== undefined ? request.extensionEnabled : true;

    console.log("Extension enabled status:", extensionEnabled);

    if (extensionEnabled) {
      console.log("Applying settings:", settings);
      applySettings(settings);
    } else {
      console.log("Extension disabled - removing all styles");
      removeAllStyles();
    }
    sendResponse({ status: "Settings applied" });
  }
  return true; // Will keep the message channel open for sendResponse
});

// Apply the settings to the sections based on the selected options
function applySettings(settings) {
  let css = "";
  Object.entries(sections).forEach(([section, selectors]) => {
    // console.log("Applying settings for section:", section);
    const setting = settings[section] || "show"; // Default to 'show' if no setting is provided
    selectors.forEach((selector) => {
      css += generateCSS(selector, setting);
    });
  });
  injectStyles(css);
}

// Generate CSS for a given selector and setting
function generateCSS(selector, setting) {
  const styleMap = {
    hide: `display: none !important;`,
    blur: `filter: blur(5px) !important; display: initial !important;`,
    // NEW: Blackout mode for thumbnails - shows black rectangle
    blackout: `filter: brightness(0) !important; display: initial !important;`,
    show: `filter: none !important; display: initial !important;`, // Ensure visibility is enforced
  };
  return `${selector} { ${styleMap[setting] || ""} }\n`;
}

// Inject styles into the document
function injectStyles(css) {
  // Remove existing styles to avoid duplication
  let styleElement = document.getElementById("custom-bilibili-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.id = "custom-bilibili-styles";
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

// Remove all custom styles (when extension is disabled)
function removeAllStyles() {
  const styleElement = document.getElementById("custom-bilibili-styles");
  if (styleElement) {
    console.log("Removing custom styles element");
    styleElement.remove();
  } else {
    console.log("No custom styles element found to remove");
  }
}
