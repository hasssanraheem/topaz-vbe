# Topaz-VBE Educational Prototype

An educational front-end replica of the **Topaz-VBE** business simulation by Edit 515 Ltd, built as a university assignment.

---

## Disclaimer

This project is **not affiliated with Edit 515 Ltd** and does not use the official Topaz-VBE simulation engine, database, or proprietary data. All financial figures, demand outcomes, and simulation results shown are **mock demonstration data** created for educational purposes. The demand and cost calculations implemented here are simplified approximations clearly labelled in the code as such.

---

## Run Instructions

### Prerequisites
- Node.js 18+

### Install and run (development)
```bash
cd topaz-vbe
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production
```bash
npm run build
```
Output is in `dist/`.

---

## Project Structure

```
topaz-vbe/
  src/
    styles/main.css          Old-school Topaz visual style (sidebar, table colours)
    data/mockData.js         All Tables 1–23 parameters + 4-period mock history
    logic/
      calculations.js        Simplified demand/cost/capacity functions (labelled)
      validation.js          Field-level + cross-field validation (validateAll)
      storage.js             localStorage wrappers (session, decisions, submit)
    components/
      SideNav.jsx            Fixed left sidebar, all 9 report links
      Header.jsx / Footer.jsx
      Button.jsx / Message.jsx
      NumberField.jsx / DecimalField.jsx / SelectField.jsx / CheckField.jsx
      DecisionPanel.jsx      Collapsible section wrapper
      DataTable.jsx          Read-only styled table
      ReadOnlyTable.jsx      Key-value financial table
      PeriodSelector.jsx     Period 1–4 selector (Reports only)
    pages/
      LoginPage.jsx
      MainMenuPage.jsx
      MarketingPage.jsx
      ProductionPage.jsx
      PersonnelPage.jsx
      FinancePage.jsx
      ReportsPage.jsx        9 sub-reports in tabs
      ReviewPage.jsx
      SubmitPage.jsx         3-step submit flow with lock
      CompanyInfoPage.jsx
      HelpPage.jsx
    App.jsx                  Routing state, layout shell
    main.jsx                 Entry point
  index.html
  vite.config.js
  package.json
```

---

## Decision → Official Topaz-VBE Mapping

| Prototype Location | Topaz-VBE Decision |
|---|---|
| Marketing → Prices | Selling prices (home and export) per product |
| Marketing → Advertising | Advertising spend per product per area |
| Marketing → Product Development | Product development investment |
| Marketing → Days Credit | Debtor days policy |
| Marketing → Selling | Salespeople allocation, salary, commission |
| Marketing → Management Budget | General management expenditure |
| Production → Delivery Schedule | Planned output per product per area |
| Production → Shift Level | Single / double / triple shift |
| Production → Assembly Times | Minutes per unit (can exceed minimum) |
| Production → Contract Maintenance | Contracted maintenance hours per machine |
| Production → Machines to Sell/Order | Machine fleet management |
| Production → Materials | Supplier selection and quantity |
| Personnel → Salespeople | Recruit, dismiss, train |
| Personnel → Assembly Workers | Recruit, dismiss, train |
| Personnel → Assembly Wage | Hourly wage rate (cannot decrease) |
| Finance → Dividend Rate | Pence per share (Q1 and Q3 only) |
| Finance → Vans | Buy or sell delivery vehicles |

---

## Assumptions and Simplifications

All simplifications are labelled in source code with `SIMPLIFIED` comments.

| Area | Official Topaz-VBE | This Prototype |
|---|---|---|
| Demand model | Proprietary multi-factor engine | Price elasticity + √advertising + selling + quality multipliers |
| Period results | Processed by administrator | Mock data from `mockData.js`; submit locks decisions only |
| Corporation tax | Complex multi-year calculation | 30% of pre-tax profit (mock) |
| Machine availability | Order arrives in Q+3 exactly | Shown in mock data only |
| Labour market | Dynamic unemployment rate | Fixed labour market assumed |
| Stock depreciation | Per-product costing | Simplified weighted average |
| Quality index | Cumulative development model | Linear approximation |
| Competitor behaviour | Full group simulation | 4 static mock competitors |

---

## Key References

- Official Topaz-VBE site: www.edit515.co.uk/topaz-vbe (requires enrolment)
- Topaz-VBE Manual (6 HTML pages) — all 23 data tables encoded in `src/data/mockData.js`
- Site visual style reverse-engineered from `site.css` on the official site

---

## Technology

- **Vite** + **React** (JavaScript, no TypeScript)
- No external UI libraries — plain CSS only
- **localStorage** for session, decisions, and submit state (no backend)
- Navigation via React state (`currentPage.page` + `currentPage.sub`)
