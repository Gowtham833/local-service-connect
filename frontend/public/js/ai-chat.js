/**
 * ServiBot — AI Customer Support Chatbot Widget
 * Powered by AWS Bedrock Claude via /api/ai/chat
 */
(function () {
  const getApiBase = () => window.__SERVICONNECT_CONFIG__?.API_BASE_URL || 'http://localhost:5000';

  const CHAT_HTML = `
  <div id="servibot-bubble" title="Chat with ServiBot">💬</div>
  <div id="servibot-window" style="display:none">
    <div id="servibot-header">
      <span>🤖 ServiBot</span>
      <span style="font-size:11px;opacity:0.7;">Powered by AI</span>
      <button id="servibot-close">✕</button>
    </div>
    <div id="servibot-messages">
      <div class="bot-msg">Hi! I'm ServiBot 👋 How can I help you today?</div>
    </div>
    <div id="servibot-input-row">
      <input id="servibot-input" type="text" placeholder="Ask anything..." />
      <button id="servibot-send">Send</button>
    </div>
  </div>`;

  const CHAT_CSS = `
  #servibot-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:#ff6b00;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;z-index:9000;box-shadow:0 4px 16px rgba(255,107,0,0.5);transition:transform 0.2s}
  #servibot-bubble:hover{transform:scale(1.1)}
  #servibot-window{position:fixed;bottom:90px;right:24px;width:340px;height:480px;background:#1a1f2e;border-radius:16px;display:flex;flex-direction:column;z-index:9001;box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow:hidden}
  #servibot-header{background:#ff6b00;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-weight:700}
  #servibot-close{background:none;border:none;color:#fff;font-size:16px;cursor:pointer}
  #servibot-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
  .bot-msg{background:#2a2f3e;color:#e2e8f0;padding:10px 14px;border-radius:12px 12px 12px 2px;max-width:85%;font-size:13px;line-height:1.5}
  .user-msg{background:#ff6b00;color:#fff;padding:10px 14px;border-radius:12px 12px 2px 12px;max-width:85%;align-self:flex-end;font-size:13px}
  #servibot-input-row{padding:12px;display:flex;gap:8px;border-top:1px solid rgba(255,255,255,0.1)}
  #servibot-input{flex:1;background:#0d1117;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:#fff;font-size:13px;outline:none}
  #servibot-send{background:#ff6b00;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600}`;

  // Inject HTML + CSS
  const style = document.createElement('style');
  style.textContent = CHAT_CSS;
  document.head.appendChild(style);

  const div = document.createElement('div');
  div.innerHTML = CHAT_HTML;
  document.body.appendChild(div);

  let history = [];

  const win      = document.getElementById('servibot-window');
  const bubble   = document.getElementById('servibot-bubble');
  const closeBtn = document.getElementById('servibot-close');
  const input    = document.getElementById('servibot-input');
  const sendBtn  = document.getElementById('servibot-send');
  const messages = document.getElementById('servibot-messages');

  bubble.addEventListener('click', () => { win.style.display = 'flex'; bubble.style.display = 'none'; });
  closeBtn.addEventListener('click', () => { win.style.display = 'none'; bubble.style.display = 'flex'; });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMessage(text, 'user');
    history.push({ role: 'user', content: text });

    const thinking = addMessage('...', 'bot');

    try {
      const res = await fetch(`${getApiBase()}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not process that.';
      thinking.textContent = reply;
      history.push({ role: 'assistant', content: reply });
    } catch {
      thinking.textContent = 'Connection error. Please try again.';
    }
  }

  function addMessage(text, type) {
    const el = document.createElement('div');
    el.className = type === 'user' ? 'user-msg' : 'bot-msg';
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
})();
