// Options page script for Prompt Enhancer Extension
// Handles API key storage and retrieval

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("settingsForm");
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  // Load saved API key on page load
  loadSavedSettings();

  // Handle form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    saveSettings();
  });

  // Handle input changes
  apiKeyInput.addEventListener("input", function () {
    if (status && !status.classList.contains("hidden")) {
      hideStatus();
    }
  });

  async function loadSavedSettings() {
    try {
      const result = await chrome.storage.sync.get(["geminiApiKey"]);
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
        showStatus("API key loaded successfully", "success");
        setTimeout(hideStatus, 2000);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showStatus("Error loading saved settings", "error");
    }
  }

  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter an API key", "error");
      apiKeyInput.focus();
      return;
    }

    // Basic API key validation
    if (!isValidApiKey(apiKey)) {
      showStatus("Invalid API key format", "error");
      apiKeyInput.focus();
      return;
    }

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      // Test the API key
      const isValid = await testApiKey(apiKey);

      if (!isValid) {
        showStatus("Invalid API key or API access error", "error");
        return;
      }

      // Save to storage
      await chrome.storage.sync.set({
        geminiApiKey: apiKey,
      });

      showStatus("Settings saved successfully! 🎉", "success");

      // Auto-hide success message after 3 seconds
      setTimeout(hideStatus, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      showStatus("Error saving settings. Please try again.", "error");
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Settings";
    }
  }

  function isValidApiKey(apiKey) {
    // Basic validation for Gemini API key format
    // Gemini API keys typically start with 'AIza' and are ~39 characters
    if (!apiKey || typeof apiKey !== "string") {
      return false;
    }

    // Remove whitespace
    apiKey = apiKey.trim();

    // Check basic format
    if (apiKey.length < 30 || apiKey.length > 50) {
      return false;
    }

    // Check if it contains only valid characters (alphanumeric, hyphens, underscores)
    const validChars = /^[A-Za-z0-9_-]+$/;
    if (!validChars.test(apiKey)) {
      return false;
    }

    return true;
  }

  async function testApiKey(apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello",
                },
              ],
            },
          ],
        }),
      });

      // If we get a response (even if it's an error), the API key format is valid
      // and the API is accessible
      return response.status !== 400; // 400 means invalid API key
    } catch (error) {
      console.error("API test error:", error);
      // If it's a network error, we'll assume the key format is valid
      // since we can't test connectivity
      return true;
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove("hidden");
  }

  function hideStatus() {
    status.classList.add("hidden");
    setTimeout(() => {
      status.textContent = "";
      status.className = "status hidden";
    }, 300);
  }

  // Handle escape key to close popup
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && window.location !== window.parent.location) {
      window.close();
    }
  });

  // Add some visual feedback for better UX
  apiKeyInput.addEventListener("focus", function () {
    this.parentElement.style.transform = "scale(1.02)";
    this.parentElement.style.transition = "transform 0.2s ease";
  });

  apiKeyInput.addEventListener("blur", function () {
    this.parentElement.style.transform = "scale(1)";
  });
});

// Handle messages from other parts of the extension
chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
  if (request.action === "openOptions") {
    // Focus on the API key input if the options page is opened
    document.getElementById("apiKey").focus();
  }
});
