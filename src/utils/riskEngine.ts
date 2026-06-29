/**
 * Quantitative Risk Engine
 * Computes Historical Simulation and Monte Carlo Value at Risk (VaR), Covariance, and Beta.
 */

// Simple helper to calculate standard deviation
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

// Simple helper to calculate covariance
export function calculateCovariance(returnsA: number[], returnsB: number[]): number {
  const len = Math.min(returnsA.length, returnsB.length);
  if (len < 2) return 0;
  
  const meanA = returnsA.reduce((a, b) => a + b, 0) / len;
  const meanB = returnsB.reduce((a, b) => a + b, 0) / len;
  
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += (returnsA[i] - meanA) * (returnsB[i] - meanB);
  }
  return sum / (len - 1);
}

// Cholesky Decomposition of a symmetric positive-definite matrix
// Covariance matrix Sigma is decomposed into L * L^T where L is lower triangular
export function choleskyDecomposition(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const l: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += l[i][k] * l[j][k];
      }

      if (i === j) {
        const val = matrix[i][i] - sum;
        // Edge case: handle very small negative numbers due to floating point inaccuracies
        if (val < 0) {
          // If slightly negative, try adding a small diagonal perturbation (ridge)
          if (val > -1e-5) {
            l[i][j] = Math.sqrt(Math.max(0, val));
          } else {
            return null; // Not positive definite
          }
        } else {
          l[i][j] = Math.sqrt(val);
        }
      } else {
        if (l[j][j] === 0) {
          l[i][j] = 0;
        } else {
          l[i][j] = (matrix[i][j] - sum) / l[j][j];
        }
      }
    }
  }

  return l;
}

// Standard Box-Muller transform to generate Independent Standard Normal variables
export function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Computes Historical Simulation Value at Risk
 * @param portfolio Current positions with market values
 * @param historicalReturns Daily return series for each symbol
 * @param confidenceLevel e.g. 0.95 or 0.99
 */
export function computeHistoricalVaR(
  portfolio: { symbol: string; marketValue: number }[],
  historicalReturns: Record<string, number[]>,
  confidenceLevel: number
): number {
  const totalValue = portfolio.reduce((sum, p) => sum + p.marketValue, 0);
  if (totalValue <= 0 || portfolio.length === 0) return 0;

  // Find the minimum return list length across our portfolio assets to align dates
  const symbols = portfolio.map(p => p.symbol);
  const lengths = symbols.map(s => historicalReturns[s]?.length || 0);
  const minLength = Math.min(...lengths);

  if (minLength < 2) return 0;

  // Compute portfolio returns for each historical day
  const portfolioReturns: number[] = [];
  for (let t = 0; t < minLength; t++) {
    let dayReturnAmount = 0;
    for (const p of portfolio) {
      const assetReturns = historicalReturns[p.symbol];
      // Note: we traverse backwards or forwards, just index them
      const r_it = assetReturns[t] || 0;
      dayReturnAmount += p.marketValue * r_it;
    }
    portfolioReturns.push(dayReturnAmount / totalValue);
  }

  // Sort returns in ascending order (worst losses at the beginning)
  portfolioReturns.sort((a, b) => a - b);

  // Find index corresponding to alpha (1 - confidenceLevel)
  const alpha = 1 - confidenceLevel;
  const index = Math.floor(alpha * portfolioReturns.length);
  const quantileReturn = portfolioReturns[Math.max(0, index)];

  // VaR is the negative dollar change (loss)
  // If quantileReturn is positive, VaR is 0 (no statistical risk of loss at this level)
  return quantileReturn < 0 ? -quantileReturn * totalValue : 0;
}

/**
 * Computes Monte Carlo Simulation Value at Risk and generates paths
 * @param portfolio Current positions with market values
 * @param historicalReturns Daily return series for each symbol
 * @param confidenceLevel e.g. 0.95 or 0.99
 * @param numSimulations number of paths to run (default: 1000)
 * @param days holding period in days (default: 1)
 */
export function computeMonteCarloVaR(
  portfolio: { symbol: string; marketValue: number; weight: number }[],
  historicalReturns: Record<string, number[]>,
  confidenceLevel: number,
  numSimulations: number = 1000,
  days: number = 10 // Let's simulate 10 days for nice visualization!
): {
  varAmount: number;
  paths: { day: number; [key: string]: number }[];
} {
  const totalValue = portfolio.reduce((sum, p) => sum + p.marketValue, 0);
  if (totalValue <= 0 || portfolio.length === 0) {
    return { varAmount: 0, paths: [] };
  }

  const symbols = portfolio.map(p => p.symbol);
  const n = symbols.length;

  // 1. Compute means and build covariance matrix
  const means: number[] = [];
  const volatilities: number[] = [];
  const returnsMatrix: number[][] = [];

  for (const sym of symbols) {
    const rets = historicalReturns[sym] || [0];
    const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
    means.push(avg);
    volatilities.push(calculateVolatility(rets));
    returnsMatrix.push(rets);
  }

  // Construct Covariance Matrix
  const sigma: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        sigma[i][j] = Math.pow(volatilities[i], 2);
      } else {
        sigma[i][j] = calculateCovariance(returnsMatrix[i], returnsMatrix[j]);
      }
    }
  }

  // Regularize diagonal slightly to ensure positive definiteness (ridge shrinkage)
  for (let i = 0; i < n; i++) {
    sigma[i][i] += 1e-8;
  }

  // 2. Cholesky Decomposition
  let L = choleskyDecomposition(sigma);
  
  // If Cholesky fails (e.g., singular or non-positive definite), fall back to independent assets
  if (!L) {
    L = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      L[i][i] = volatilities[i];
    }
  }

  // 3. Simulate paths
  // Store portfolio values for each simulation path at each day
  // pathValues[simulationIndex][dayIndex]
  const pathValues: number[][] = Array.from({ length: numSimulations }, () => Array(days + 1).fill(totalValue));

  for (let s = 0; s < numSimulations; s++) {
    // Keep track of current values for each asset in this simulation
    const currentAssetValues = portfolio.map(p => p.marketValue);

    for (let d = 1; d <= days; d++) {
      // Generate standard normal variables
      const Z = Array.from({ length: n }, () => gaussianRandom());
      
      // Compute correlated random standard normals X = L * Z
      const X = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
          X[i] += L[i][j] * Z[j];
        }
      }

      // Update asset values using Geometric Brownian Motion (GBM) step
      // S_t = S_{t-1} * exp( (mu - 0.5 * sigma^2) * dt + sigma * dW )
      // Here dt = 1 day
      let portfolioSum = 0;
      for (let i = 0; i < n; i++) {
        const mu = means[i];
        const vol = volatilities[i];
        
        // Simulating the daily logarithmic return
        const drift = mu - 0.5 * Math.pow(vol, 2);
        // Note: X[i] already incorporates the asset volatility structure via Cholesky L,
        // so we don't multiply by vol again if we use Cholesky returns directly.
        // Wait, Cholesky random vector X has covariance Sigma, meaning standard deviation of X[i] is already vol[i].
        // Therefore, X[i] has scale of daily asset volatility!
        // To properly scale the drift, we can write:
        const assetReturn = Math.exp(drift + X[i]);
        
        currentAssetValues[i] = currentAssetValues[i] * assetReturn;
        portfolioSum += currentAssetValues[i];
      }

      pathValues[s][d] = portfolioSum;
    }
  }

  // Calculate the portfolio values at the target day (the end of the holding period)
  const finalValues = pathValues.map(p => p[days]);
  
  // Simulated P&Ls relative to starting value
  const simPLs = finalValues.map(v => v - totalValue);
  simPLs.sort((a, b) => a - b); // Ascending order (worst outcomes first)

  const alpha = 1 - confidenceLevel;
  const index = Math.floor(alpha * numSimulations);
  const quantilePL = simPLs[Math.max(0, index)];

  // Value at Risk is negative P&L (worst loss)
  const varAmount = quantilePL < 0 ? -quantilePL : 0;

  // Prepare 5 sample paths + stats curves (median, 5th percentile, 95th percentile) for charting
  // This produces very engaging fan-charts!
  const paths: { day: number; [key: string]: number }[] = [];

  // For each day, find percentiles across all simulations to plot bands
  for (let d = 0; d <= days; d++) {
    const dayValues = pathValues.map(p => p[d]);
    dayValues.sort((a, b) => a - b);

    const p5 = dayValues[Math.floor(0.05 * numSimulations)];
    const p50 = dayValues[Math.floor(0.50 * numSimulations)];
    const p95 = dayValues[Math.floor(0.95 * numSimulations)];

    const row: { day: number; [key: string]: number } = {
      day: d,
      percentile5: Math.round(p5 * 100) / 100,
      median: Math.round(p50 * 100) / 100,
      percentile95: Math.round(p95 * 100) / 100,
    };

    // Include 5 actual random simulated paths for visual flair
    for (let pathIdx = 0; pathIdx < 5; pathIdx++) {
      row[`path${pathIdx}`] = Math.round(pathValues[pathIdx][d] * 100) / 100;
    }

    paths.push(row);
  }

  return {
    varAmount,
    paths,
  };
}

/**
 * Computes individual asset Beta relative to SPY
 */
export function computeBeta(assetReturns: number[], spyReturns: number[]): number {
  if (!assetReturns || !spyReturns || assetReturns.length === 0 || spyReturns.length === 0) return 1.0;
  const spyVariance = calculateCovariance(spyReturns, spyReturns);
  if (spyVariance === 0) return 1.0;
  return calculateCovariance(assetReturns, spyReturns) / spyVariance;
}
