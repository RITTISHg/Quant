export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

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
        if (val < 0) {
          if (val > -1e-5) {
            l[i][j] = Math.sqrt(Math.max(0, val));
          } else {
            return null;
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

export function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function computeHistoricalVaR(
  portfolio: { symbol: string; marketValue: number }[],
  historicalReturns: Record<string, number[]>,
  confidenceLevel: number
): number {
  const totalValue = portfolio.reduce((sum, p) => sum + p.marketValue, 0);
  if (totalValue <= 0 || portfolio.length === 0) return 0;

  const symbols = portfolio.map(p => p.symbol);
  const lengths = symbols.map(s => historicalReturns[s]?.length || 0);
  const minLength = Math.min(...lengths);

  if (minLength < 2) return 0;

  const portfolioReturns: number[] = [];
  for (let t = 0; t < minLength; t++) {
    let dayReturnAmount = 0;
    for (const p of portfolio) {
      const assetReturns = historicalReturns[p.symbol];
      const r_it = assetReturns[t] || 0;
      dayReturnAmount += p.marketValue * r_it;
    }
    portfolioReturns.push(dayReturnAmount / totalValue);
  }

  portfolioReturns.sort((a, b) => a - b);

  const alpha = 1 - confidenceLevel;
  const index = Math.floor(alpha * portfolioReturns.length);
  const quantileReturn = portfolioReturns[Math.max(0, index)];

  return quantileReturn < 0 ? -quantileReturn * totalValue : 0;
}

export function computeMonteCarloVaR(
  portfolio: { symbol: string; marketValue: number; weight: number }[],
  historicalReturns: Record<string, number[]>,
  confidenceLevel: number,
  numSimulations: number = 1000,
  days: number = 10
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

  for (let i = 0; i < n; i++) {
    sigma[i][i] += 1e-8;
  }

  let L = choleskyDecomposition(sigma);
  
  if (!L) {
    L = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      L[i][i] = volatilities[i];
    }
  }

  const pathValues: number[][] = Array.from({ length: numSimulations }, () => Array(days + 1).fill(totalValue));

  for (let s = 0; s < numSimulations; s++) {
    const currentAssetValues = portfolio.map(p => p.marketValue);

    for (let d = 1; d <= days; d++) {
      const Z = Array.from({ length: n }, () => gaussianRandom());
      
      const X = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
          X[i] += L[i][j] * Z[j];
        }
      }

      let portfolioSum = 0;
      for (let i = 0; i < n; i++) {
        const mu = means[i];
        const vol = volatilities[i];
        
        const drift = mu - 0.5 * Math.pow(vol, 2);
        const assetReturn = Math.exp(drift + X[i]);
        
        currentAssetValues[i] = currentAssetValues[i] * assetReturn;
        portfolioSum += currentAssetValues[i];
      }

      pathValues[s][d] = portfolioSum;
    }
  }

  const finalValues = pathValues.map(p => p[days]);
  
  const simPLs = finalValues.map(v => v - totalValue);
  simPLs.sort((a, b) => a - b);

  const alpha = 1 - confidenceLevel;
  const index = Math.floor(alpha * numSimulations);
  const quantilePL = simPLs[Math.max(0, index)];

  const varAmount = quantilePL < 0 ? -quantilePL : 0;

  const paths: { day: number; [key: string]: number }[] = [];

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

export function computeBeta(assetReturns: number[], spyReturns: number[]): number {
  if (!assetReturns || !spyReturns || assetReturns.length === 0 || spyReturns.length === 0) return 1.0;
  const spyVariance = calculateCovariance(spyReturns, spyReturns);
  if (spyVariance === 0) return 1.0;
  return calculateCovariance(assetReturns, spyReturns) / spyVariance;
}
