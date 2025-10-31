// popup.js

// all section in popup.html
const sectionsToHandle = [
  "bilibiliHome",
  "bilibiliComments",
  "bilibiliSidebar",
  "bilibiliUpNext",
  "bilibiliSubscription",
  "bilibiliTrending",
  "bilibiliDanmuku",
];

// When the popup is opened, load the settings from storage and set up event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
});

// Load the settings from storage. If no settings are found, use the default settings
function loadSettings() {
  chrome.storage.sync.get(["bilibiliSettings"], (result) => {
    const settings = result.bilibiliSettings || {};
    sectionsToHandle.forEach((section) => {
      const selectedOption = settings[section] || "show";
      setToggleState(section, selectedOption);
    });
  });
}

// Set the toggle switch state based on the selected option
// Checked = hide (blocking), Unchecked = show (not blocking)
function setToggleState(section, selectedOption) {
  const toggle = document.querySelector(`input[data-section="${section}"]`);
  const statusText = document.querySelector(`span[data-status="${section}"]`);

  if (toggle) {
    // Reverse logic: checked = hide, unchecked = show
    toggle.checked = selectedOption === "hide";
  }

  if (statusText) {
    updateStatusText(statusText, selectedOption);
  }
}

// Update the status text based on the current state
function updateStatusText(statusElement, state) {
  if (state === "hide") {
    statusElement.textContent = "Hidden";
    statusElement.classList.remove("visible");
    statusElement.classList.add("hidden");
  } else {
    statusElement.textContent = "Showing";
    statusElement.classList.remove("hidden");
    statusElement.classList.add("visible");
  }
}

// Set up event listeners for toggle switches to save and apply settings
function setupEventListeners() {
  sectionsToHandle.forEach((section) => {
    const toggle = document.querySelector(`input[data-section="${section}"]`);
    if (toggle) {
      toggle.addEventListener("change", () => {
        const statusText = document.querySelector(
          `span[data-status="${section}"]`
        );
        const newState = toggle.checked ? "hide" : "show";

        if (statusText) {
          updateStatusText(statusText, newState);
        }

        saveAndApplySettings();
      });
    }
  });
}

// Save the selected options and apply the settings to the current tab
function saveAndApplySettings() {
  const settings = sectionsToHandle.reduce((acc, section) => {
    const toggle = document.querySelector(`input[data-section="${section}"]`);
    // Reverse logic: Checked = hide, Unchecked = show
    acc[section] = toggle && toggle.checked ? "hide" : "show";
    return acc;
  }, {});

  chrome.storage.sync.set({ bilibiliSettings: settings }, () => {
    // console.log("Settings saved");
    sendSettingsToContentScript(settings);
  });
}

// Send the settings to the content script to apply the changes
function sendSettingsToContentScript(settings) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      console.log("Sending settings to content script:", settings);
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "applySettings",
          settings,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
          } else {
            console.log("Response from content script:", response);
          }
        }
      );
    } else {
      console.error("No active tab found.");
    }
  });
}
