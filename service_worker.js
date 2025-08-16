// Service Worker for Prompt Enhancer Extension
// Handles installation and basic background tasks

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Prompt Enhancer extension installed");
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "pong" });
  }
  return true;
});
