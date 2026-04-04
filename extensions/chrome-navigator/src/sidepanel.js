document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const savedSnippetsContainer = document.getElementById('saved-snippets');

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Handle Search using messaging to content script (fallback) or API
  const performSearch = debounce(async (query) => {
    if (!query) {
      resultsContainer.innerHTML = '';
      return;
    }

    resultsContainer.innerHTML = '<li class="result-item"><div class="result-title">Searching...</div></li>';

    // Send message to active tab to perform page-level DOM scraping/search
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.includes("docs.skales.app")) {
        resultsContainer.innerHTML = '<li class="result-item"><div class="result-title">Please navigate to docs.skales.app</div></li>';
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SEARCH_DOCS', query: query }, (response) => {
        resultsContainer.innerHTML = '';
        if (chrome.runtime.lastError || !response || !response.results.length) {
          resultsContainer.innerHTML = '<li class="result-item"><div class="result-title">No local results found on this page.</div></li>';
          return;
        }

        response.results.forEach(result => {
          const li = document.createElement('li');
          li.className = 'result-item';
          
          const title = document.createElement('div');
          title.className = 'result-title';
          title.textContent = result.title;
          
          const snippet = document.createElement('div');
          snippet.className = 'result-snippet';
          snippet.textContent = result.snippet;
          
          li.appendChild(title);
          li.appendChild(snippet);
          
          // Click to scroll to element in the page
          li.addEventListener('click', () => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'SCROLL_TO', id: result.id });
          });
          
          resultsContainer.appendChild(li);
        });
      });
    });
  }, 300);

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  // Load saved snippets from storage
  function loadSavedSnippets() {
    chrome.storage.local.get(['savedSnippets'], (result) => {
      savedSnippetsContainer.innerHTML = '';
      const snippets = result.savedSnippets || [];
      if (snippets.length === 0) {
        savedSnippetsContainer.innerHTML = '<div>No saved snippets yet.</div>';
        return;
      }
      snippets.forEach(snippet => {
        const div = document.createElement('div');
        div.className = 'snippet-item';
        div.textContent = snippet;
        savedSnippetsContainer.appendChild(div);
      });
    });
  }

  loadSavedSnippets();

  // Listen for storage changes to update snippets in real time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.savedSnippets) {
      loadSavedSnippets();
    }
  });
});
