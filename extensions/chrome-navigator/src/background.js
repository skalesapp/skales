// Setup SidePanel behavior on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionIconClick: true })
  .catch((error) => console.error(error));

// Create context menu for highlighting and saving text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-skales",
    title: "Save to Skales",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-skales") {
    saveSnippet(info.selectionText);
    
    // Attempt to open the side panel
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_SNIPPET') {
    saveSnippet(request.code);
    
    if (sender.tab) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
  }
});

function saveSnippet(text) {
  chrome.storage.local.get(['savedSnippets'], (result) => {
    const snippets = result.savedSnippets || [];
    // Prepend new snippet and keep only top 20
    const newSnippets = [text, ...snippets].slice(0, 20);
    chrome.storage.local.set({ savedSnippets: newSnippets });
  });
}
