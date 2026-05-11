/**
 * AI Chatbot Service — Customer Support
 * Uses rule-based FAQ + AWS Bedrock Claude fallback.
 * Trained on ServiConnect platform usage questions.
 */

const FAQ = [
  // How to use — Customer
  { q: ['how to book', 'how do i book', 'book a service', 'how to request'], a: 'To book a service: 1) Log in as a Customer. 2) On your dashboard, click "Book a Service". 3) Select the service type (e.g. Plumbing, Electrical). 4) Enter your address and description. 5) Click "Book Now" — nearby workers will be notified instantly!' },
  { q: ['login', 'how to login', 'sign in', 'customer login'], a: 'To log in: Go to the ServiConnect homepage and click "Customer Login" or "Worker Login". Enter your registered email and password. If you don\'t have an account, click "Register" to create one.' },
  { q: ['register', 'sign up', 'create account', 'new account'], a: 'To register: Click "Customer Login" on the homepage, then click "Register". Fill in your name, phone, email, city, and password. For workers, go to "Worker Login" → "Register" and also add your skills and experience.' },
  { q: ['forgot password', 'reset password', 'change password'], a: 'Currently, password reset is done by contacting support at support@serviconnect.in. Our team will help you reset your password within 24 hours.' },
  { q: ['track worker', 'where is my worker', 'track my booking', 'live track'], a: 'Once a worker accepts your job, you can track them live on the map in your Customer Dashboard. The map updates in real-time as the worker moves toward your location.' },
  { q: ['cancel booking', 'cancel my order', 'cancel service'], a: 'To cancel a booking, go to your Customer Dashboard → Recent Jobs → find the booking → click "Cancel". Cancellation is free if done before the worker starts travel.' },
  { q: ['how long', 'wait time', 'how much time', 'eta', 'when will worker arrive'], a: 'Workers typically arrive within 15–45 minutes depending on your location and availability. The average match time is 2–5 minutes. You\'ll see the estimated arrival on your map.' },

  // Pricing
  { q: ['price', 'cost', 'how much', 'pricing', 'charges', 'fee', 'rate'], a: 'Our pricing varies by service:\n• Plumbing: ₹300–₹800\n• Electrical: ₹400–₹1200\n• Cleaning: ₹500–₹2000\n• AC Service: ₹600–₹1500\n• Carpentry: ₹400–₹1200\n• Painting: ₹800–₹3000\nThe AI suggests a price when you book. Final price is agreed with the worker.' },
  { q: ['payment', 'how to pay', 'pay cash', 'upi', 'online payment'], a: 'Payment is made directly to the worker after the job is complete. You can pay via Cash, UPI (GPay, PhonePe, Paytm), or bank transfer. Online in-app payment is coming soon!' },

  // Services
  { q: ['what services', 'available services', 'which services', 'types of service'], a: 'ServiConnect offers: 🔧 Plumbing, ⚡ Electrical, 🧹 Cleaning, 🎨 Painting, 🪟 Carpentry, ❄️ AC Service, 💧 Water Tanker, 🩺 Medical Help (Nurse/Elderly Care). More coming soon!' },
  { q: ['plumbing', 'plumber'], a: 'Our plumbers handle: leaking pipes, tap repairs, drain cleaning, bathroom fixtures, water heater installation, and emergency plumbing. Typical cost: ₹300–₹800.' },
  { q: ['electrical', 'electrician'], a: 'Our electricians handle: wiring, switch/socket repairs, fan installation, circuit breaker issues, inverter setup, and power backup. Typical cost: ₹400–₹1200.' },
  { q: ['cleaning', 'cleaner', 'house cleaning'], a: 'Our cleaning services include: home cleaning, office cleaning, deep cleaning, sofa/carpet cleaning, and post-construction cleanup. Typical cost: ₹500–₹2000.' },
  { q: ['ac', 'air conditioner', 'ac service', 'ac repair'], a: 'Our AC technicians handle: installation, gas refilling, filter cleaning, cooling issues, and full servicing. Typical cost: ₹600–₹1500.' },

  // Worker questions
  { q: ['how to accept job', 'accept booking', 'worker accept'], a: 'As a worker: 1) Go online by toggling "Available" on your dashboard. 2) You\'ll see open job requests in your area. 3) Click "Accept" on any job that matches your skills. 4) The customer will be notified immediately!' },
  { q: ['how to go online', 'worker online', 'available', 'toggle available'], a: 'To go online as a worker: Log in to your Worker Dashboard → Click the "Go Online" toggle at the top. You\'ll start receiving job requests matching your skills.' },
  { q: ['worker earnings', 'how much can i earn', 'worker income', 'salary'], a: 'Your earnings depend on the jobs you complete. Most workers earn ₹500–₹3000 per day. You keep 100% of what the customer pays. ServiConnect does not charge a commission currently.' },
  { q: ['how to complete job', 'mark complete', 'job done'], a: 'To mark a job complete: Go to your Worker Dashboard → Active Jobs → click "Mark Complete" → enter the final price. The customer will be asked to rate your service.' },
  { q: ['rating', 'review', 'how to rate', 'rate worker'], a: 'After a job is completed, customers can rate workers from 1–5 stars and leave a comment. Workers with higher ratings get prioritized in AI matching and shown first to customers.' },

  // Technical
  { q: ['not working', 'error', 'problem', 'issue', 'bug', 'cant login', 'cannot login'], a: 'If you\'re experiencing technical issues: 1) Try refreshing the page. 2) Clear your browser cache. 3) Check your internet connection. 4) If the issue persists, contact us at support@serviconnect.in with a screenshot.' },
  { q: ['cities', 'where available', 'coverage', 'location', 'which city'], a: 'ServiConnect is currently live in: Hyderabad, Chennai, Bangalore, Mumbai, Delhi, Pune, Kolkata, Ahmedabad, Jaipur, and Lucknow. More cities coming soon!' },
  { q: ['contact', 'support', 'help', 'phone number', 'email'], a: 'You can reach our support team at:\n📧 Email: support@serviconnect.in\n📞 Phone: +91-1800-123-4567 (Mon–Sat, 8am–8pm)\n💬 Or just chat with me here!' },
  { q: ['thanks', 'thank you', 'ok', 'okay', 'got it', 'great', 'perfect'], a: 'You\'re welcome! 😊 Is there anything else I can help you with?' },
  { q: ['hello', 'hi', 'hey', 'hola', 'namaste'], a: 'Hello! 👋 I\'m ServiBot, your ServiConnect assistant. How can I help you today? You can ask me about booking services, pricing, tracking workers, or anything else about the platform!' },
];

function getFAQAnswer(message) {
  const lower = message.toLowerCase().trim();
  for (const item of FAQ) {
    if (item.q.some(kw => lower.includes(kw))) {
      return item.a;
    }
  }
  return null;
}

async function getChatbotResponse(message, history = []) {
  // 1. Try FAQ first (instant, no AI cost)
  const faqAnswer = getFAQAnswer(message);
  if (faqAnswer) return faqAnswer;

  // 2. Try to enrich with live DB data if asking about workers
  let contextAddon = '';
  const lowerMsg = message.toLowerCase();
  const isWorkerQuery = lowerMsg.includes('best') || lowerMsg.includes('suggest') || lowerMsg.includes('recommend') ||
    lowerMsg.includes('worker') || lowerMsg.includes('plumber') || lowerMsg.includes('electrician') ||
    lowerMsg.includes('cleaner') || lowerMsg.includes('carpenter') || lowerMsg.includes('ac') ||
    lowerMsg.includes('painter') || lowerMsg.includes('near') || lowerMsg.includes('top');

  if (isWorkerQuery) {
    try {
      const { db } = require('../models/index');

      // Detect which service is being asked about
      const serviceMap = {
        'plumb': 'Plumbing', 'electr': 'Electrical', 'clean': 'Cleaning',
        'paint': 'Painting', 'carp': 'Carpentry', 'ac': 'AC Service',
        'water': 'Water Tanker', 'medic': 'Medical Help', 'nurse': 'Medical Help'
      };
      let filterService = null;
      for (const [kw, svc] of Object.entries(serviceMap)) {
        if (lowerMsg.includes(kw)) { filterService = svc; break; }
      }

      const where = { isVerified: true };
      // Show online workers first, but include offline too for suggestions

      const workers = await db.Worker.findAll({
        where,
        attributes: ['firstName', 'lastName', 'skills', 'rating', 'experience', 'city', 'phone', 'isAvailable', 'totalJobs'],
        order: [['rating', 'DESC NULLS LAST'], ['isAvailable', 'DESC']],
        limit: 12
      });

      // Filter by service if detected
      let relevant = filterService
        ? workers.filter(w => (w.skills || []).includes(filterService))
        : workers;

      if (relevant.length === 0) relevant = workers; // fallback to all

      // Also fetch their latest review
      const workerIds = relevant.slice(0, 8).map(w => w.id);
      let reviewMap = {};
      try {
        const reviews = await db.Review.findAll({
          where: { workerId: workerIds },
          order: [['createdAt', 'DESC']],
          attributes: ['workerId', 'comment', 'rating']
        });
        reviews.forEach(r => { if (!reviewMap[r.workerId]) reviewMap[r.workerId] = r; });
      } catch(e) {}

      if (relevant.length > 0) {
        contextAddon = `\n\nVerified workers${filterService ? ` for ${filterService}` : ''} (sorted by rating):\n` +
          relevant.slice(0, 8).map(w => {
            const status = w.isAvailable ? '🟢 Online' : '⚫ Offline';
            const rev = reviewMap[w.id];
            const reviewSnippet = rev ? ` | Latest review: "${rev.comment.substring(0, 60)}"` : '';
            return `- ${w.firstName} ${w.lastName} | Skills: ${(w.skills||[]).join(', ')} | Rating: ${w.rating||'New'}/5 | ${w.experience||'N/A'} exp | City: ${w.city} | 📞 ${w.phone} | ${status}${reviewSnippet}`;
          }).join('\n');
      }
    } catch (e) { /* skip DB enrichment if it fails */ }
  }

  // 3. Fall back to Bedrock Claude
  try {
    const { invokeClaudeModel } = require('./bedrockService');
    const SYSTEM_CONTEXT = `You are ServiBot, a friendly customer support assistant for ServiConnect — an on-demand home services platform in India.
You help with: booking services, checking status, pricing (₹300–₹3000 range), cancellation, rating workers, platform usage.
Services: Plumbing, Electrical, Cleaning, AC Service, Carpentry, Painting, Water Tanker, Medical Help.
Cities: Hyderabad, Chennai, Bangalore, Mumbai, Delhi, Pune, Kolkata, Ahmedabad, Jaipur, Lucknow.
Support: support@serviconnect.in | +91-1800-123-4567
IMPORTANT: When suggesting or recommending workers, ALWAYS include their phone number, rating, city, online/offline status, and any recent review snippet from the context below. Format recommendations clearly with each worker on a new line.
Keep responses concise, friendly, and helpful. If out of scope, refer to support.${contextAddon}`;

    const conversationHistory = history.slice(-6);
    const prompt = `${SYSTEM_CONTEXT}\n\nConversation:\n${conversationHistory.map(m => `${m.role === 'user' ? 'Customer' : 'ServiBot'}: ${m.content}`).join('\n')}\n\nCustomer: ${message}\nServiBot:`;
    const response = await invokeClaudeModel(prompt, { maxTokens: 512, temperature: 0.5 });
    return response.trim();
  } catch (err) {
    console.error('[AI] Chatbot failed:', err.message);
    return 'I\'m not sure about that, but I\'m here to help! For specific issues, please contact support@serviconnect.in or call +91-1800-123-4567. Is there anything else I can help you with? 😊';
  }
}

module.exports = { getChatbotResponse };
