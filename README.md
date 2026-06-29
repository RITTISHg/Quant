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
