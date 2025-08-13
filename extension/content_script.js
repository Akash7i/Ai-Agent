// content_script.js

// Create a reusable floating container (hidden initially)
const FLOAT_ID = 'ai-quickassist-widget';

function createWidget() {
  if (document.getElementById(FLOAT_ID)) return;

  const container = document.createElement('div');
  container.id = FLOAT_ID;
  container.style.position = 'fixed';
  container.style.zIndex = 2147483647;
  container.style.minWidth = '260px';
  container.style.maxWidth = '420px';
  container.style.background = 'white';
  container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
  container.style.borderRadius = '8px';
  container.style.padding = '10px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.display = 'none';

  container.innerHTML = `
    <div id="ai-qa-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <strong>AI QuickAssist</strong>
      <button id="ai-close-btn" title="Close" style="border:none;background:transparent;cursor:pointer">✕</button>
    </div>
    <div id="ai-qa-body">Select text and press the extension button or right-click → "Ask AI".</div>
    <div id="ai-qa-footer" style="margin-top:8px;text-align:right">
      <button id="ai-copy-btn" style="padding:6px 8px;border-radius:6px;border:1px solid #ddd;cursor:pointer">Copy</button>
    </div>
  `;

  document.body.appendChild(container);

  document.getElementById('ai-close-btn').onclick = () => { container.style.display = 'none'; };
  document.getElementById('ai-copy-btn').onclick = () => {
    const txt = document.getElementById('ai-qa-body').innerText;
    navigator.clipboard.writeText(txt).then(()=>{/*copied*/});
  };
}

createWidget();

// Show widget near the selection
function showWidgetAt(x, y, html) {
  const container = document.getElementById(FLOAT_ID);
  container.style.left = x + 'px';
  container.style.top = y + 'px';
  document.getElementById('ai-qa-body').innerHTML = html;
  container.style.display = 'block';
}

// Get selected text
function getSelectedText() {
  const sel = window.getSelection();
  return sel ? sel.toString().trim() : '';
}

// Listen for messages from background (service worker)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'ai-answer') {
    const { answer, rect } = msg.payload;
    // Place widget near rect if provided
    let x = (rect?.x || 100) + window.scrollX;
    let y = (rect?.y || 100) + window.scrollY + 20;
    showWidgetAt(x, y, answer.replace(/\n/g,'<br>'));
  }
});

// Add a context menu action (makes user flow easier)
// The context menu is registered from service_worker, but we also allow keyboard selection + shortcut flow

// Optional: show widget when user selects text and presses a keyboard shortcut (Ctrl+Shift+S)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
    const text = getSelectedText();
    if (!text) return alert('Select some text first');

    // compute selection bounding rect
    const sel = window.getSelection();
    let rect;
    if (sel.rangeCount) rect = sel.getRangeAt(0).getBoundingClientRect();

    chrome.runtime.sendMessage({ type: 'ask-ai', payload: { text, rect } });
  }
});

// Also detect double-click selection and auto ask (optional)
let autoAskEnabled = false; // set true if you want auto behavior

document.addEventListener('dblclick', () => {
  if (!autoAskEnabled) return;
  const text = getSelectedText();
  if (!text) return;
  const sel = window.getSelection();
  let rect = sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
  chrome.runtime.sendMessage({ type: 'ask-ai', payload: { text, rect } });
});