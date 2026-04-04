// Function to add "Save to Skales" buttons to code blocks
function injectSaveButtons() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach((block, index) => {
    if (block.parentElement.querySelector('.skales-save-btn')) return; // Already injected
    
    // Position button relatively to the pre tag
    block.parentElement.style.position = 'relative';
    
    const btn = document.createElement('button');
    btn.className = 'skales-save-btn';
    btn.textContent = 'Save to Skales';
    btn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    
    btn.onmouseover = () => btn.style.opacity = '1';
    btn.onmouseleave = () => btn.style.opacity = '0.8';
    
    btn.onclick = () => {
      const code = block.innerText;
      chrome.runtime.sendMessage({ type: 'SAVE_SNIPPET', code: code });
      btn.textContent = 'Saved!';
      setTimeout(() => btn.textContent = 'Save to Skales', 2000);
    };
    
    block.parentElement.appendChild(btn);
  });
}

// Observe DOM for dynamic code blocks
const observer = new MutationObserver((mutations) => {
  injectSaveButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial injection
injectSaveButtons();

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEARCH_DOCS') {
    const query = request.query.toLowerCase();
    const headers = document.querySelectorAll('h1, h2, h3, h4');
    let results = [];
    
    headers.forEach((header, index) => {
      const text = header.innerText.toLowerCase();
      if (text.includes(query)) {
        // Find next paragraph for snippet
        let snippet = '';
        let nextEl = header.nextElementSibling;
        while(nextEl && nextEl.tagName !== 'H1' && nextEl.tagName !== 'H2' && nextEl.tagName !== 'H3' && nextEl.tagName !== 'H4') {
          if (nextEl.tagName === 'P') {
            snippet = nextEl.innerText;
            break;
          }
          nextEl = nextEl.nextElementSibling;
        }
        
        // Ensure id exists for scrolling
        if (!header.id) {
          header.id = 'skales-header-' + index;
        }
        
        results.push({
          id: header.id,
          title: header.innerText,
          snippet: snippet || text
        });
      }
    });
    
    sendResponse({ results: results });
  } else if (request.type === 'SCROLL_TO') {
    const element = document.getElementById(request.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Minor highlight effect
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = '#ffff99';
      setTimeout(() => {
        element.style.backgroundColor = originalBg;
      }, 2000);
    }
    sendResponse({ success: true });
  }
  return true;
});
