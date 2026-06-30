# QuantRisk: Real-Time Portfolio Risk Engine

QuantRisk is a real-time portfolio management and quantitative risk engine. It computes advanced risk metrics, such as **Value at Risk (VaR)** via both Historical Simulation and Monte Carlo methodologies, and monitors portfolio concentrations in real-time.

---

## Key Features

- **Real-Time Price Streams**: Leverages live pricing updates to simulate instantaneous valuation and risk threshold warnings.
- **Value at Risk (VaR) Engine**:
  - **Historical Simulation (1-Day Horizon)**: Empirically calculates potential portfolio losses using 90-day asset return series.
  - **Monte Carlo Simulations (10-Day Horizon)**: Simulates 1,000+ paths via Geometric Brownian Motion (GBM) with correlated multi-asset walks resolved via Cholesky Decomposition of the historical covariance matrix.
- **Dynamic Asset Allocation & Exposure Maps**: Instantly updates sector allocation limits, concentration metrics, and P&L status.
- **Audit Ledger & Trade History**: Log buy/sell transactions with full historical tracing and automatic rebalancing of weights.

---

## Live Demo

Below are screenshots of the running QuantRisk portfolio cockpit and simulation charts:

### 🖥️ Full Running Dashboard
![Dashboard](./screenshots/Screenshot%20From%202026-06-30%2022-09-23.png)

### 📈 Monte Carlo Simulation Output
![Monte Carlo Charts](./screenshots/Screenshot%20From%202026-06-30%2022-09-31.png)

### 🛡️ Active Allocation & Exposure Heatmap
![Active Exposure Heatmap](./screenshots/Screenshot%20From%202026-06-30%2022-09-36.png)

---

## Risk Methodology

**Historical Simulation VaR (1-Day)**
- Uses 90-day rolling window of actual asset returns
- Confidence level: 95%

**Monte Carlo VaR (10-Day)**  
- 1,000+ simulated price paths via Geometric Brownian Motion
- Multi-asset correlation preserved via Cholesky Decomposition
- Confidence level: 99%

**Why both methods?**
Historical simulation captures fat tails in real return distributions.
Monte Carlo models forward-looking scenarios under correlated shocks — the same methodology used in bank-level stress testing.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, WebSockets (`ws`)
- **Mathematical Modeling**: Custom quantitative engine built with TypeScript (No heavy external math libraries required)

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### Installation

1. Clone the repository to your local workspace:
   ```bash
   git clone <your-repository-url>
   cd quantrisk-portfolio-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

- **Development Mode**: Run both the Express backend and the Vite server with live reload:
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000` in your browser.

- **Production Build**: Compile the frontend bundle and build the self-contained backend:
  ```bash
  npm run build
  npm start
  ```

---

## Directory Structure

```text
├── data/                    # JSON storage for transaction history logs
├── src/
│   ├── components/          # Reusable React components (Charts, Tables, Cards)
│   ├── utils/
│   │   └── riskEngine.ts    # Mathematical model routines (Monte Carlo, VaR, Cholesky)
│   ├── types.ts             # Shared TypeScript types and static configurations
│   ├── App.tsx              # Application layout and WebSocket hookups
│   └── main.tsx             # React SPA entry point
├── server.ts                # Express backend & WebSocket server
├── index.html               # Main HTML wrapper
├── package.json             # App dependencies and scripts configuration
└── tsconfig.json            # TypeScript compiler configuration
```
