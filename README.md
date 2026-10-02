# Topaz VBE — Virtual Business Environment

A web-based business simulation platform where student companies compete against each other across multiple quarters, making strategic decisions on pricing, production, staffing, and finance. Each quarter the admin runs the simulation engine which calculates outcomes for all companies simultaneously.

---

## What It Does

- **8 companies** per simulation session, each managed by a student team
- Each team submits decisions every quarter (prices, production, staffing, marketing, etc.)
- The admin rolls the quarter — the simulation engine runs and produces detailed management reports for every company
- Teams can view their reports, compare performance with competitors, and adjust strategy for the next round
- The admin controls economic conditions (GDP, inflation, strike weeks, interest rates) that affect all companies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), plain CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | Firebase Authentication |
| Simulation | Pure JS deterministic engine (no randomness) |

---

## Project Structure

```
topaz-vbe/
├── client/                        # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   └── FullManagementReport.jsx   # Full printed-style report layout
│       ├── context/
│       │   └── AuthContext.jsx            # Firebase auth context
│       ├── lib/
│       │   └── api.js                     # Authenticated API fetch helper
│       └── pages/
│           ├── DashboardPage.jsx          # Main app — all tabs live here
│           ├── DecisionFormPage.jsx       # Decision entry form per company
│           └── LoginPage.jsx             # Firebase login screen
│
└── server/                        # Express backend
    ├── index.js                   # Server entry point, route wiring
    └── src/
        ├── engine/
        │   ├── simulation.js      # Core simulation engine — all financial maths
        │   ├── adapter.js         # Converts frontend fields → engine format
        │   ├── tables.js          # All constants and initial state (T1–T23)
        │   └── validation.js      # Decision field validation rules
        ├── middleware/
        │   ├── verifyToken.js     # Firebase token verification
        │   └── requireRole.js     # Admin-only route guard
        ├── models/
        │   ├── Session.js         # Simulation session (one per season)
        │   ├── Quarter.js         # Each quarter within a session
        │   ├── Team.js            # The 8 companies
        │   ├── User.js            # Firebase-linked user accounts
        │   ├── Decision.js        # One decision record per team per quarter
        │   ├── Report.js          # Published simulation results per team per quarter
        │   └── AuditLog.js        # Admin action log
        └── routes/
            ├── decisions.js       # Decision CRUD, submit, roll quarter, reports
            ├── advanceAdmin.js    # Admin panels: session info, companies, quarters, economic shocks, reset
            ├── admin.js           # User management
            ├── auth.js            # Login / token validation
            └── quarters.js        # Quarter queries
```

---

## How to Run

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)
- Firebase project with Authentication enabled

### 1. Environment variables

**Server** — create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/topaz-vbe
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PORT=4000
```

**Client** — create `client/.env`:
```
VITE_API_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Seed the database (first run only)
```bash
cd server
node scripts/seed-companies.js   # creates the 8 company records
node scripts/seed-users.js       # creates user accounts linked to companies
```

### 4. Start the servers
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:4000`.

---

## How the Simulation Works

### Decision Lifecycle

```
not_saved → saved → submitted → rolled (published)
```

1. Each company team logs in and fills out their decision form
2. They **Save** (draft, can edit) then **Submit** (locks their decisions)
3. The admin rolls the quarter — the engine runs and publishes results
4. A new quarter opens automatically; all forms reset to allow new decisions

### The Engine (`server/src/engine/simulation.js`)

The simulation runs in two phases for every quarter:

**Phase A** (per company, independent):
- Calculates production capacity (machine hours, assembly hours, materials)
- Scales production down if any resource is insufficient
- Computes attractiveness index per product per market area (price, promotion, quality)

**Phase B** (all companies together):
- Market demand is shared between companies using their attractiveness index (more attractive = bigger market share)
- Revenue, costs, overheads, P&L, balance sheet, and cash flow are all calculated
- Results are saved as a `Report` document in MongoDB

**What carries forward quarter to quarter:**
- Machine and vehicle count + book value (with depreciation)
- Assembly worker headcount (±recruits and dismissals)
- Material stock (closing stock becomes next quarter's opening stock)
- Product warehouse stock per area
- Debtors, creditors, tax due, cash, overdraft, reserves
- Share price (evolves based on profit)

### Economic Shocks (Admin Panel)

The admin can set these before rolling each quarter:

| Setting | Effect |
|---|---|
| GDP growth % | Scales total market demand up or down |
| Recession | Cuts demand by 15% |
| Inflation % | Reduces purchasing power slightly |
| Central bank rate % | Affects interest paid on overdraft and received on cash |
| Material price change % | Adjusts raw material cost next quarter |
| Strike weeks (0–3) | Removes 48 assembly hours per worker per strike week |
| Strike weeks next quarter | Shown as a notice in the current report |

### Personnel Costs (T15)

Recruit/dismiss/train decisions carry real costs charged to overheads:

| Action | Salesperson | Assembly Worker |
|---|---|---|
| Recruit | £1,500 | £1,200 |
| Dismiss | £5,000 | £3,000 |
| Train | £6,000 | £4,500 |

---

## Admin Panel — Advance Tab

| Panel | What it does |
|---|---|
| **Industries** | Shows session name and simulation code |
| **Teams** | Lists all 8 companies, toggle active/inactive |
| **Quarters & Roll** | Shows all quarters and their status; roll the next quarter |
| **Company Submission Status** | Live view of which companies have submitted/saved/not saved |
| **Require all to submit** | Checkbox that blocks rolling until every company submits |
| **Economic Shocks** | Set macro conditions for the next roll |
| **Audit Log** | Full history of all admin actions |
| **New Season / Reset** | Archive the current session and restart at 2024 Q1 |

---

## Management Report

When a quarter is published, each company gets a detailed report with 7 sections:

1. **Company Position** — key metrics vs previous quarter (profit, revenue, net worth, orders, stock)
2. **Decisions in Effect** — the exact decisions that were applied this quarter
3. **Availability & Use of Resources** — machines, assembly hours, materials, personnel headcount
4. **Product Movements** — scheduled, produced, rejected, serviced, delivered, sold, backlog, stock per product per area
5. **Accounts** — Overhead Cost Analysis, P&L, Balance Sheet, Cash Flow Statement
6. **Business Intelligence** — share price, dividend %; if purchased: competitor data and market shares
7. **Economic Information** — macro conditions that applied this quarter

Reports open in a full-screen overlay and can be printed. Previous-quarter data is shown in the "Previous" and "Change" columns automatically.

---

## New Season / Reset

Use the **Reset & Start New Season** button in the Advance tab to:
- Archive the current session (marked `completed` in the database — data is preserved)
- Create a fresh session starting at **2024 Quarter 1**
- All 8 companies keep their names and accounts but start with a clean decision slate

Old reports remain in the database but are no longer shown in the UI (filtered by active session).

---

## Security Notes

- Firebase tokens are verified server-side on every request (`verifyToken` middleware)
- Role (`admin` vs team user) is read from the MongoDB `User` record — never trusted from the client
- Team number is always resolved server-side from the authenticated user's record
- Admin-only endpoints use `requireAdmin` middleware; team users get `403`
- Firebase service account JSON is gitignored and must never be committed
- All secrets are in `.env` files which are gitignored

---

## Known Limitations

- Machine orders are installed in the same quarter they are placed (no one-quarter delivery lag)
- Absenteeism/sickness hours are modelled as zero (no random absence model)
- Salesperson headcount is not tracked independently across quarters — only the per-area allocation in decisions is used
- The simulation is deterministic (same decisions + same macro = same result every time)
