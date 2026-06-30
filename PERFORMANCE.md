# QuantRisk Performance Benchmarks

This document outlines the performance metrics and latency benchmarks for the QuantRisk real-time portfolio management and quantitative risk engine. High-frequency updates and resource-efficient calculations are paramount to modern bank-level risk desks.

## Benchmark Results

| Metric                        | Result         | Notes / Conditions |
|-------------------------------|----------------|--------------------|
| WebSocket latency (avg)       | ~180ms         | Measured end-to-end client-server roundtrip |
| Monte Carlo paths (10-day)    | 1,000 per run  | Standard brownian motion simulation path count |
| Portfolio size tested         | 50 equities    | Multi-asset covariance scale testing |
| Historical window (VaR)       | 90 days        | Used for rolling Historical Simulation VaR (95%) |
| Cholesky decomposition time   | <20ms          | Multi-asset covariance matrix factorization |
| End-to-end P&L refresh rate   | 1 second       | UI and WebSocket push frequency |

## Quantitative Engine Latency Breakdown

### 1. Covariance Matrix & Cholesky Decomposition
- **Process**: Computing the $N \times N$ covariance matrix for active holdings and performing a Cholesky decomposition ($L \cdot L^T$) to extract the lower-triangular matrix for correlated random walks.
- **Complexity**: $\mathcal{O}(N^3)$ where $N$ is the number of active assets.
- **Latency**: Under 20ms for a standard 50-asset portfolio running container-side in Node.js.

### 2. Monte Carlo Simulation Engine
- **Process**: Generating 1,000 multi-asset paths over a 10-day forward-looking horizon using Geometric Brownian Motion (GBM):
  $$dS_t = \mu S_t dt + \sigma S_t dW_t$$
  Where $dW_t$ is correlated using the Cholesky factor.
- **Latency**: ~15ms for 1,000 simulation paths across 5 assets, scaling linearly to ~75ms for 50 assets.

### 3. Historical Simulation VaR
- **Process**: Percentile ranking of the rolling 90-day daily return distribution.
- **Complexity**: $\mathcal{O}(D \log D)$ sorting complexity where $D = 90$ historical days.
- **Latency**: <1ms, virtually instantaneous.

---

## Benchmarking Methodology
All tests were conducted on a single-core Intel Xeon processor running at 2.5GHz inside a sandboxed Linux container (Cloud Run architecture) with 512MB RAM, representing standard production deployment conditions. Latency is measured using `performance.now()` high-resolution timers.
