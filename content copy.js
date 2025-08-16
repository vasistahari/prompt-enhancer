// Content Script for Prompt Enhancer Extension
// Injects enhancement buttons into AI chat interfaces

class PromptEnhancer {
  constructor() {
    this.observer = null;
    this.processedElements = new Set();
    this.init();
  }

  init() {
    this.setupMutationObserver();
    this.processExistingElements();
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" ||
            mutation.attributeName === "style")
        ) {
          shouldProcess = true;
        }
      });

      if (shouldProcess) {
        // Debounce the processing to avoid excessive calls
        clearTimeout(this.processTimeout);
        this.processTimeout = setTimeout(() => {
          this.processExistingElements();
        }, 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  }

  processExistingElements() {
    const selectors = this.getInputSelectors();

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (
          !this.processedElements.has(element) &&
          this.isValidInput(element)
        ) {
          this.injectEnhanceButton(element);
          this.processedElements.add(element);
        }
      });
    });
  }

  getInputSelectors() {
    const hostname = window.location.hostname;

    if (hostname.includes("openai.com") || hostname.includes("chatgpt.com")) {
      return [
        'textarea[data-id="root"]',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Message"]',
        "#prompt-textarea",
        'textarea[data-testid="textbox"]',
      ];
    } else if (hostname.includes("gemini.google.com")) {
      return [
        'div[contenteditable="true"]',
        'textarea[data-test-id="input-textarea"]',
        ".ql-editor",
        '[data-test-id="input-field"]',
      ];
    } else if (hostname.includes("perplexity.ai")) {
      return [
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="follow"]',
        'div[contenteditable="true"]',
        '[data-testid="textbox"]',
      ];
    }

    return [];
  }

  isValidInput(element) {
    if (!element) return false;

    // Check if element is visible
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;

    // Check if it's actually an input element
    const tagName = element.tagName.toLowerCase();
    if (tagName === "textarea") return true;
    if (tagName === "div" && element.getAttribute("contenteditable") === "true")
      return true;

    return false;
  }

  injectEnhanceButton(inputElement) {
    // Check if button already exists
    const existingButton = inputElement.parentNode?.querySelector(
      ".prompt-enhancer-btn"
    );
    if (existingButton) return;

    const button = this.createEnhanceButton();
    this.insertButton(inputElement, button);

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.enhancePrompt(inputElement, button);
    });
  }

  createEnhanceButton() {
    const button = document.createElement("button");
    button.className = "prompt-enhancer-btn";
    button.innerHTML = "✨ Enhance Prompt";
    button.type = "button";

    // Comprehensive styling to work in light and dark modes
    button.style.cssText = `
      background: linear-gradient(135deg, #4285f4, #1a73e8) !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 8px 16px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      margin: 8px 0 !important;
      z-index: 9999 !important;
      position: relative !important;
      min-width: 140px !important;
      text-align: center !important;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    });

    return button;
  }

  insertButton(inputElement, button) {
    const container = document.createElement("div");
    container.className = "prompt-enhancer-container";
    container.style.cssText = `
      display: flex !important;
      justify-content: flex-end !important;
      margin-top: 4px !important;
      margin-bottom: 4px !important;
    `;

    container.appendChild(button);

    // Try different insertion strategies based on the site
    const hostname = window.location.hostname;

    if (hostname.includes("openai.com") || hostname.includes("chatgpt.com")) {
      // For ChatGPT, insert after the textarea's parent container
      const parentForm =
        inputElement.closest("form") ||
        inputElement.closest("[data-testid]") ||
        inputElement.parentNode;
      if (parentForm && parentForm.parentNode) {
        parentForm.parentNode.insertBefore(container, parentForm.nextSibling);
      }
    } else if (hostname.includes("gemini.google.com")) {
      // For Gemini, insert after the input container
      const parentContainer =
        inputElement.closest("[data-test-id]") || inputElement.parentNode;
      if (parentContainer && parentContainer.parentNode) {
        parentContainer.parentNode.insertBefore(
          container,
          parentContainer.nextSibling
        );
      }
    } else if (hostname.includes("perplexity.ai")) {
      // For Perplexity, insert after the textarea container
      const parentContainer =
        inputElement.closest("div") || inputElement.parentNode;
      if (parentContainer && parentContainer.parentNode) {
        parentContainer.parentNode.insertBefore(
          container,
          parentContainer.nextSibling
        );
      }
    }

    // Fallback insertion method
    if (!container.parentNode) {
      if (inputElement.parentNode) {
        inputElement.parentNode.insertBefore(
          container,
          inputElement.nextSibling
        );
      }
    }
  }

  async enhancePrompt(inputElement, button) {
    try {
      const originalText = button.innerHTML;
      button.innerHTML = "⏳ Enhancing...";
      button.disabled = true;

      // Get current prompt text
      const promptText = this.getInputValue(inputElement);

      if (!promptText.trim()) {
        this.showError(button, "Please enter a prompt first");
        return;
      }

      // Get API key from storage
      const result = await chrome.storage.sync.get(["geminiApiKey"]);
      const apiKey = result.geminiApiKey;

      if (!apiKey) {
        this.showError(button, "API key not set");
        chrome.runtime.openOptionsPage();
        return;
      }

      // Call Gemini API
      const enhancedPrompt = await this.callGeminiAPI(promptText, apiKey);

      // Update input with enhanced prompt
      this.setInputValue(inputElement, enhancedPrompt);

      // Show success feedback
      button.innerHTML = "✅ Enhanced!";
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("Enhancement error:", error);
      this.showError(button, "Enhancement failed");
    }
  }

  getInputValue(element) {
    if (element.tagName.toLowerCase() === "textarea") {
      return element.value;
    } else if (element.getAttribute("contenteditable") === "true") {
      return element.innerText || element.textContent;
    }
    return "";
  }

  setInputValue(element, value) {
    if (element.tagName.toLowerCase() === "textarea") {
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (element.getAttribute("contenteditable") === "true") {
      element.innerText = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Trigger focus to ensure the interface recognizes the change
    element.focus();
  }

  async callGeminiAPI(promptText, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Enhance the following prompt to be clearer, more specific, and more effective. Make it more detailed and actionable while preserving the original intent. Return only the enhanced prompt without any additional explanation:\n\n${promptText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API Error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid API response format");
    }

    return data.candidates[0].content.parts[0].text.trim();
  }

  showError(button, message) {
    const originalText = button.innerHTML;
    button.innerHTML = `❌ ${message}`;
    button.style.background = "linear-gradient(135deg, #ea4335, #d33b2c)";

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = "linear-gradient(135deg, #4285f4, #1a73e8)";
      button.disabled = false;
    }, 3000);
  }
}

// Initialize the extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new PromptEnhancer();
  });
} else {
  new PromptEnhancer();
}
