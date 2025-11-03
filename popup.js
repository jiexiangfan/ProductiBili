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
  "bilibiliThumbnails",
];

// Sections that support 3-way toggle (show/blur/blackout or hide)
const threeWaySections = ["bilibiliThumbnails"];

// When the popup is opened, load the settings from storage and set up event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
  setupMasterToggle(); // Master toggle
});

// Load the settings from storage. If no settings are found, use the default settings
function loadSettings() {
  chrome.storage.sync.get(
    ["bilibiliSettings", "extensionEnabled"],
    (result) => {
      const settings = result.bilibiliSettings || {};
      const extensionEnabled =
        result.extensionEnabled !== undefined ? result.extensionEnabled : true;

      // Update master toggle
      const masterToggle = document.getElementById("masterToggle");
      const masterStatus = document.getElementById("masterStatus");
      if (masterToggle) {
        masterToggle.checked = extensionEnabled;
        updateMasterStatus(masterStatus, extensionEnabled);
      }

      // Update individual section toggles
      sectionsToHandle.forEach((section) => {
        const selectedOption = settings[section] || "show";
        if (threeWaySections.includes(section)) {
          setThreeWayToggleState(section, selectedOption);
        } else {
          setToggleState(section, selectedOption);
        }
      });

      // Enable/disable controls based on master toggle
      updateControlsState(extensionEnabled);
    }
  );
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
    statusElement.classList.remove("showing", "blurred");
    statusElement.classList.add("hidden");
  } else if (state === "blur") {
    statusElement.textContent = "Blurred";
    statusElement.classList.remove("showing", "hidden");
    statusElement.classList.add("blurred");
  } else if (state === "blackout") {
    statusElement.textContent = "Blackout";
    statusElement.classList.remove("showing", "hidden");
    statusElement.classList.add("blurred"); // Use same style as blur
  } else {
    statusElement.textContent = "Showing";
    statusElement.classList.remove("hidden", "blurred");
    statusElement.classList.add("showing");
  }
}

// NEW: Update master toggle status text
function updateMasterStatus(statusElement, enabled) {
  if (statusElement) {
    if (enabled) {
      statusElement.textContent = "ON";
      statusElement.classList.remove("disabled");
      statusElement.classList.add("enabled");
    } else {
      statusElement.textContent = "OFF";
      statusElement.classList.remove("enabled");
      statusElement.classList.add("disabled");
    }
  }
}

// NEW: Set three-way toggle state (for thumbnails: show/blur/blackout)
function setThreeWayToggleState(section, selectedOption) {
  const buttons = document.querySelectorAll(
    `button[data-section="${section}"]`
  );
  const statusText = document.querySelector(`span[data-status="${section}"]`);

  buttons.forEach((button) => {
    const mode = button.dataset.mode;
    if (mode === selectedOption) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  if (statusText) {
    updateStatusText(statusText, selectedOption);
  }
}

// Set up event listeners for toggle switches to save and apply settings
function setupEventListeners() {
  sectionsToHandle.forEach((section) => {
    if (threeWaySections.includes(section)) {
      // Three-way toggle (buttons)
      const buttons = document.querySelectorAll(
        `button[data-section="${section}"]`
      );
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const mode = button.dataset.mode;
          const statusText = document.querySelector(
            `span[data-status="${section}"]`
          );

          // Update button states
          buttons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");

          if (statusText) {
            updateStatusText(statusText, mode);
          }

          saveAndApplySettings();
        });
      });
    } else {
      // Regular two-way toggle (hide/show)
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
    }
  });
}

// NEW FEATURE 2: Set up master toggle event listener
function setupMasterToggle() {
  const masterToggle = document.getElementById("masterToggle");
  const masterStatus = document.getElementById("masterStatus");

  if (masterToggle) {
    masterToggle.addEventListener("change", () => {
      const isEnabled = masterToggle.checked;
      console.log("Master toggle changed to:", isEnabled);
      updateMasterStatus(masterStatus, isEnabled);
      updateControlsState(isEnabled);

      // Save and apply
      chrome.storage.sync.set({ extensionEnabled: isEnabled }, () => {
        console.log("Extension enabled saved:", isEnabled);
        sendSettingsToContentScript();
      });
    });
  }
}

// NEW: Enable/disable all controls based on master toggle
function updateControlsState(enabled) {
  const settingsContainer = document.querySelector(".settings-container");
  if (settingsContainer) {
    if (enabled) {
      settingsContainer.classList.remove("disabled");
    } else {
      settingsContainer.classList.add("disabled");
    }
  }
}

// Save the selected options and apply the settings to the current tab
function saveAndApplySettings() {
  const settings = sectionsToHandle.reduce((acc, section) => {
    if (threeWaySections.includes(section)) {
      // Get active button for three-way toggle
      const activeButton = document.querySelector(
        `button[data-section="${section}"].active`
      );
      acc[section] = activeButton ? activeButton.dataset.mode : "show";
    } else {
      // Regular toggle: Checked = hide, Unchecked = show
      const toggle = document.querySelector(`input[data-section="${section}"]`);
      acc[section] = toggle && toggle.checked ? "hide" : "show";
    }
    return acc;
  }, {});

  chrome.storage.sync.set({ bilibiliSettings: settings }, () => {
    // console.log("Settings saved");
    sendSettingsToContentScript();
  });
}

// Send the settings to the content script to apply the changes
function sendSettingsToContentScript() {
  chrome.storage.sync.get(
    ["bilibiliSettings", "extensionEnabled"],
    (result) => {
      const settings = result.bilibiliSettings || {};
      const extensionEnabled =
        result.extensionEnabled !== undefined ? result.extensionEnabled : true;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          console.log(
            "Sending settings to content script:",
            settings,
            "Enabled:",
            extensionEnabled
          );
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "applySettings",
              settings,
              extensionEnabled,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error sending message:",
                  chrome.runtime.lastError
                );
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
  );
}
