# ServiConnect: Project Tech Stack & Tools Overview

Ee document lo manam ServiConnect project kosam vaadina **Languages, Frameworks, Tools, mariyu AWS Services** gurinchi clear ga explain cheyadam jarigindi.

---

## 1. Frontend (User Interface / Client Side)
User ki kanipinche screens mariyu browser lo run ayye logic kosam kindha unna technologies vaadam:

*   **HTML5 & CSS3**: Application yokka structure mariyu beautiful styling kosam. External frameworks (like Tailwind/Bootstrap) meeda depend avvakunda **Pure Vanilla CSS** use chesi modern UI (glassmorphism, gradients, smooth animations) design chesam.
*   **Vanilla JavaScript (ES6+)**: React leda Angular lanti heavy frameworks lekunda, direct JavaScript tho DOM manipulation mariyu API calls chesam. Idi application ni chala fast ga mariyu lightweight ga unchuthundi.
*   **Leaflet.js**: Live map tracking kosam. Customer tana service book chesinappudu, worker ekkada unnado real-time lo map meeda choodadaniki (Google Maps ki alternative open-source library) idhi vaadam.
*   **Socket.io-client**: Real-time updates (chat messages, worker location changes, booking status notifications) page refresh cheyakunda ventane browser ki raavadaniki idi use chesam.

---

## 2. Backend (Server Side & API)
Application yokka main logic, data processing, mariyu API creation kosam ivi vaadam:

*   **Node.js & Express.js**: Server-side runtime ga Node.js ni, mariyu REST API routes (login, register, book service etc.) create cheyadaniki Express.js framework ni use chesam.
*   **Sequelize (ORM)**: Database tho interact avvadaniki direct ga SQL queries rayakunda, JavaScript objects dwara database tables (Customers, Workers, Bookings) ni manage cheyadaniki idhi vadam.
*   **Socket.io (Server)**: Frontend ki live ga data pampadaniki WebSockets connection ni maintain chestundi.
*   **JWT (JSON Web Tokens)**: User authentication kosam. Customer/Worker login ayinappudu oka secure token isthundi, aa token unte ne dashboard access vasthundi.
*   **bcryptjs**: Passwords ni direct ga database lo save cheyakunda, secure ga encrypt (hash) cheyadaniki idhi use chesam.

---

## 3. Database (Data Storage)
*   **PostgreSQL**: Manam vadina database idhi. Idi oka powerful Relational Database Management System (RDBMS). Users data, address, bookings history, mariyu reviews anni correct ga relations tho store cheyadaniki idi vaadam.

---

## 4. AWS Cloud Services (Deployment & Hosting)
Application ni local computer lo kakunda live internet lo pattaniki (production deployment) kindha unna Amazon Web Services (AWS) vaadam:

*   **AWS EC2 (Elastic Compute Cloud)**: Idi mana virtual server. Frontend files, Node.js backend, mariyu PostgreSQL database motham ee okka Linux server (Amazon Linux) lone host cheyadam jarigindi.
*   **AWS CloudFormation**: AWS account lo manual ga EC2 instance, security groups create cheyakunda, oka "Infrastructure as Code" (YAML script) file dwara single click tho server start avvadaniki idi use chesam.
*   **AWS Bedrock (Claude AI)**: Mana application lo unna **Smart AI Features** kosam Amazon Bedrock ni use chesam:
    *   **AI Chatbot**: Users adige questions ki answers ivvadaniki.
    *   **Price Estimation**: Oka service (ex: Plumbing) ki entha cost avthundi ani estimate cheyadaniki.
    *   **Worker Matching**: Customer location mariyu problem batti best suitable worker ni assign cheyadaniki.

---

## 5. DevOps & Server Management Tools
Server lopaliki vellaka app ni manage chese tools:

*   **Nginx (Web Server / Reverse Proxy)**: Internet nunchi vache traffic ni handle chestundi. Port 80 lo vache requests ni theeskuni frontend HTML pages ni isthundi, alage `/api` tho vache requests ni Node.js backend (Port 5000) ki forward chestundi.
*   **PM2 (Process Manager)**: Node.js backend server eppudu crash avvakunda, 24/7 background lo continuous ga run avvadaniki idi use chesam.
*   **Git & GitHub**: Mana code ni version control cheyadaniki mariyu GitHub nunchi code ni AWS EC2 server loki push/pull cheyadaniki idhi vaadam.

---

### **Summary of the Flow (Ela pani chestundi):**
1. User browser lo website open cheyagane, **AWS EC2** lo unna **Nginx** vallaki **HTML/CSS/JS** files pamputhundi.
2. User details fill chesi Login/Book nokkagane, frontend nunchi **Express.js (Node.js)** backend ki request velthundi.
3. Backend ventane **PostgreSQL** database lo data check chesi / save chesi response isthundi.
4. Emaina AI answers kavali ante backend nunchi **AWS Bedrock** ki call velthundi.
5. Job assign ayyaka, worker move avthunte **Socket.io** dwara live map **Leaflet.js** lo update avthundi.
