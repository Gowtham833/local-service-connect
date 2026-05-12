/**
 * ServiBot — AI Customer Support Chatbot Widget
 * Powered by AWS Bedrock Claude via /api/ai/chat
 */
(function () {
  const getApiBase = () => window.__SERVICONNECT_CONFIG__?.API_BASE_URL || 'http://localhost:5000';

  const CHAT_HTML = `
  <div id="servibot-bubble" title="Chat with ServiBot">🤖</div>
  <div id="servibot-window" style="display:none">
    <div id="servibot-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;background:#22c55e;border-radius:50%;box-shadow:0 0 10px #22c55e"></div>
        <span>ServiBot AI</span>
      </div>
      <button id="servibot-close">✕</button>
    </div>
    <div id="servibot-messages">
      <div class="bot-msg">Hi! I'm ServiBot 👋 Your AI assistant. How can I help you today?</div>
    </div>
    <div id="servibot-input-row">
      <input id="servibot-input" type="text" placeholder="Type a message..." />
      <button id="servibot-send">🚀</button>
    </div>
  </div>`;

  const CHAT_CSS = `
  #servibot-bubble{position:fixed;bottom:24px;right:24px;width:64px;height:64px;background:linear-gradient(135deg, #8B5CF6, #E85D75);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;cursor:pointer;z-index:9000;box-shadow:0 10px 25px rgba(139,92,246,0.5);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);border:2px solid rgba(255,255,255,0.2)}
  #servibot-bubble:hover{transform:scale(1.1) rotate(5deg)}
  #servibot-window{position:fixed;bottom:100px;right:24px;width:360px;height:520px;background:rgba(22, 35, 54, 0.9);backdrop-filter:blur(20px);border-radius:24px;display:flex;flex-direction:column;z-index:9001;box-shadow:0 15px 50px rgba(0,0,0,0.6);overflow:hidden;border:1px solid rgba(255,255,255,0.1);animation:slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)}
  @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  #servibot-header{background:rgba(255,255,255,0.03);padding:18px 20px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Syne',sans-serif}
  #servibot-close{background:rgba(255,255,255,0.1);border:none;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s}
  #servibot-close:hover{background:rgba(255,92,26,0.4)}
  #servibot-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin}
  .bot-msg{background:rgba(255,255,255,0.07);color:#fff;padding:12px 16px;border-radius:18px 18px 18px 4px;max-width:85%;font-size:14px;line-height:1.6;border:1px solid rgba(255,255,255,0.05)}
  .user-msg{background:linear-gradient(135deg, #8B5CF6, #E85D75);color:#fff;padding:12px 16px;border-radius:18px 18px 4px 18px;max-width:85%;align-self:flex-end;font-size:14px;line-height:1.6;box-shadow:0 4px 12px rgba(139,92,246,0.3)}
  #servibot-input-row{padding:16px;display:flex;gap:10px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05)}
  #servibot-input{flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;color:#fff;font-size:14px;outline:none;transition:border 0.2s}
  #servibot-input:focus{border-color:var(--orange)}
  #servibot-send{background:var(--orange);color:#fff;border:none;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1.2rem;transition:all 0.2s}
  #servibot-send:hover{transform:scale(1.05);filter:brightness(1.1)}`;

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
