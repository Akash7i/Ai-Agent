chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askAI",
    title: "Ask AI about \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "askAI" && info.selectionText) {
    const question = info.selectionText.trim();

    console.log("User selected:", question); // Debug log

    try {
      const response = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      console.log("AI Response:", data.answer); // Debug log

      if (data.answer) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (answer) => {
            alert("AI says: " + answer);
          },
          args: [data.answer]
        });
      } else {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            alert("No answer from AI server.");
          }
        });
      }

    } catch (error) {
      console.error("Error talking to server:", error);
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errMsg) => {
          alert("Error: " + errMsg);
        },
        args: [error.message]
      });
    }
  }
});
