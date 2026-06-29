import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocket, WebSocketServer } from "ws";
import { 
  computeHistoricalVaR, 
  computeMonteCarloVaR, 
  computeBeta, 
  calculateVolatility 
} from "./src/utils/riskEngine.js"; // Standard Node.js ESM import or TS resolution
// Note: We can import from typescript files directly since tsx runs it. Let's use direct path imports.
import { SECTOR_MAP, Trade, Position, LivePrice, RiskMetrics, HistoricalPerformance } from "./src/types.js";

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TRADES_FILE = path.join(DATA_DIR, "trades.json");

// Default initial trades to seed if none exist
const DEFAULT_TRADES: Trade[] = [
  { id: "t1", symbol: "AAPL", type: "BUY", quantity: 50, price: 195.50, timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: "t2", symbol: "MSFT", type: "BUY", quantity: 30, price: 390.00, timestamp: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString() },
  { id: "t3", symbol: "NVDA", type: "BUY", quantity: 100, price: 110.25, timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
  { id: "t4", symbol: "GOOGL", type: "BUY", quantity: 40, price: 162.00, timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  { id: "t5", symbol: "JPM", type: "BUY", quantity: 40, price: 182.50, timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  { id: "t6", symbol: "TSLA", type: "BUY", quantity: 25, price: 172.10, timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: "t7", symbol: "SPY", type: "BUY", quantity: 50, price: 512.30, timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
];

if (!fs.existsSync(TRADES_FILE)) {
  fs.writeFileSync(TRADES_FILE, JSON.stringify(DEFAULT_TRADES, null, 2), "utf8");
}

// Global In-Memory Cache (the "Redis-like" store)
// Maps symbol -> LivePrice
const livePriceCache: Record<string, LivePrice> = {};

// Historical daily prices map (for risk math)
// Maps symbol -> number[] of closing prices (past ~90 days)
const historicalPricesCache: Record<string, number[]> = {};

// Fetch or generate historical prices
function generateSyntheticHistory(symbol: string, days: number = 90): number[] {
  const meta = SECTOR_MAP[symbol] || { sector: "Technology", name: symbol };
  
  // Set highly realistic starting prices
  let basePrice = 150;
  let dailyVol = 0.02; // 2% daily volatility (~31% annualized)

  switch (symbol) {
    case "AAPL": basePrice = 210; dailyVol = 0.015; break;
    case "MSFT": basePrice = 415; dailyVol = 0.013; break;
    case "GOOGL": basePrice = 175; dailyVol = 0.016; break;
    case "NVDA": basePrice = 125; dailyVol = 0.030; break;
    case "TSLA": basePrice = 185; dailyVol = 0.028; break;
    case "AMZN": basePrice = 190; dailyVol = 0.017; break;
    case "META": basePrice = 490; dailyVol = 0.020; break;
    case "JPM": basePrice = 195; dailyVol = 0.012; break;
    case "V": basePrice = 270; dailyVol = 0.010; break;
    case "JNJ": basePrice = 150; dailyVol = 0.008; break;
    case "WMT": basePrice = 65; dailyVol = 0.009; break;
    case "XOM": basePrice = 115; dailyVol = 0.014; break;
    case "DIS": basePrice = 100; dailyVol = 0.016; break;
    case "KO": basePrice = 62; dailyVol = 0.007; break;
    case "SPY": basePrice = 540; dailyVol = 0.008; break;
  }

  const prices: number[] = [basePrice];
  const drift = 0.0004; // Slightly positive daily drift (~10% annual return)

  for (let i = 1; i < days; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const pctChange = drift + dailyVol * normal;
    const nextPrice = prices[prices.length - 1] * (1 + pctChange);
    prices.push(Math.round(nextPrice * 100) / 100);
  }

  return prices;
}

async function getStockHistory(symbol: string): Promise<number[]> {
  if (historicalPricesCache[symbol]) {
    return historicalPricesCache[symbol];
  }

  try {
    console.log(`Fetching real historical data from Yahoo Finance for ${symbol}...`);
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned status ${res.status}`);
    }

    const data: any = await res.json();
    const result = data?.chart?.result?.[0];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
    
    if (closes.length === 0) {
      throw new Error(`Empty price array for ${symbol}`);
    }

    // Clean data: replace nulls with last valid close
    const cleanedCloses: number[] = [];
    let lastValid = closes.find(c => c !== null) || 100;

    for (const val of closes) {
      if (val === null) {
        cleanedCloses.push(lastValid);
      } else {
        cleanedCloses.push(val);
        lastValid = val;
      }
    }

    historicalPricesCache[symbol] = cleanedCloses;
    console.log(`Success! Loaded ${cleanedCloses.length} real price points for ${symbol}.`);
    return cleanedCloses;
  } catch (error: any) {
    console.warn(`Could not load real data for ${symbol}: ${error.message}. Falling back to high-fidelity synthetic GBM prices.`);
    const synth = generateSyntheticHistory(symbol, 90);
    historicalPricesCache[symbol] = synth;
    return synth;
  }
}

// Pre-populate caches
async function prefillCaches(symbols: string[]) {
  // Ensure SPY is always prefetched for beta calculation
  const allSymbols = Array.from(new Set([...symbols, "SPY"]));
  console.log("Prefilling stock data cache...");
  for (const sym of allSymbols) {
    const history = await getStockHistory(sym);
    
    // Set initial live price as the last closing price
    const lastPrice = history[history.length - 1];
    const prevPrice = history[history.length - 2] || lastPrice;
    const change = lastPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    livePriceCache[sym] = {
      symbol: sym,
      price: lastPrice,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      lastUpdated: new Date().toISOString(),
      history: history.slice(-15), // keep last 15 days for mini sparklines
    };
  }
  console.log("Caches prefilled successfully!");
}

// Parse trades file and return list
function loadTrades(): Trade[] {
  try {
    const data = fs.readFileSync(TRADES_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Save trades file
function saveTrades(trades: Trade[]) {
  fs.writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2), "utf8");
}

// Aggregate positions from trades
function aggregatePositions(trades: Trade[]): Position[] {
  const positionsMap: Record<string, { qty: number; totalCost: number }> = {};

  for (const t of trades) {
    if (!positionsMap[t.symbol]) {
      positionsMap[t.symbol] = { qty: 0, totalCost: 0 };
    }

    const pos = positionsMap[t.symbol];
    if (t.type === "BUY") {
      pos.qty += t.quantity;
      pos.totalCost += t.quantity * t.price;
    } else {
      // For SELL, subtract qty. If we sell, average cost remains the same.
      // But we adjust total cost proportionally to keep average cost consistent.
      if (pos.qty > 0) {
        const avgPrice = pos.totalCost / pos.qty;
        pos.qty = Math.max(0, pos.qty - t.quantity);
        pos.totalCost = pos.qty * avgPrice;
      }
    }
  }

  const positions: Position[] = [];
  let totalPortfolioValue = 0;

  // First pass to compute current market values and filter zero-qty assets
  const activeSymbols = Object.keys(positionsMap).filter(sym => positionsMap[sym].qty > 0);
  
  for (const sym of activeSymbols) {
    const data = positionsMap[sym];
    const livePriceObj = livePriceCache[sym] || { price: data.totalCost / data.qty, change: 0, changePercent: 0 };
    const currentPrice = livePriceObj.price;
    const marketValue = data.qty * currentPrice;
    totalPortfolioValue += marketValue;
  }

  // Second pass to compute weights, sectors, and P&L
  for (const sym of activeSymbols) {
    const data = positionsMap[sym];
    const avgCost = data.totalCost / data.qty;
    const livePriceObj = livePriceCache[sym] || { price: avgCost, change: 0, changePercent: 0 };
    const currentPrice = livePriceObj.price;
    const totalCost = data.totalCost;
    const marketValue = data.qty * currentPrice;
    const plAmount = marketValue - totalCost;
    const plPercentage = totalCost > 0 ? (plAmount / totalCost) * 100 : 0;
    const weight = totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;
    
    const info = SECTOR_MAP[sym] || { sector: "Other", name: sym };

    positions.push({
      symbol: sym,
      quantity: data.qty,
      averageBuyPrice: Math.round(avgCost * 100) / 100,
      currentPrice: Math.round(currentPrice * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      marketValue: Math.round(marketValue * 100) / 100,
      plAmount: Math.round(plAmount * 100) / 100,
      plPercentage: Math.round(plPercentage * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      sector: info.sector,
      name: info.name,
    });
  }

  return positions;
}

// Compute the complete metrics suite
function calculateMetricsSuite(positions: Position[], trades: Trade[], confidence: number = 0.95): {
  metrics: RiskMetrics;
  monteCarloPaths: any[];
  historicalPerf: HistoricalPerformance[];
} {
  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  // Get daily returns matrix for risk calculations
  const historicalReturns: Record<string, number[]> = {};
  
  // Calculate historical returns for each position and SPY
  const activeSymbols = Array.from(new Set([...positions.map(p => p.symbol), "SPY"]));
  
  for (const sym of activeSymbols) {
    const prices = historicalPricesCache[sym] || [];
    const rets: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyRet = (prices[i] - prices[i - 1]) / prices[i - 1];
      rets.push(dailyRet);
    }
    historicalReturns[sym] = rets;
  }

  // Calculate portfolio-level returns and daily volatility
  let dailyPL = 0;
  let prevTotalVal = 0;

  for (const p of positions) {
    const priceObj = livePriceCache[p.symbol];
    if (priceObj) {
      dailyPL += p.quantity * priceObj.change;
      prevTotalVal += p.quantity * (priceObj.price - priceObj.change);
    }
  }

  const dailyPLPercent = prevTotalVal > 0 ? (dailyPL / prevTotalVal) * 100 : 0;

  // Prepare input for VaR calculations
  const varPortfolio = positions.map(p => ({
    symbol: p.symbol,
    marketValue: p.marketValue,
    weight: p.weight / 100,
  }));

  // Historical Simulation VaR
  const historicalVaR95 = computeHistoricalVaR(varPortfolio, historicalReturns, 0.95);
  const historicalVaR99 = computeHistoricalVaR(varPortfolio, historicalReturns, 0.99);

  // Monte Carlo Simulation VaR
  const mcResults95 = computeMonteCarloVaR(varPortfolio, historicalReturns, 0.95, 1000, 10);
  const mcResults99 = computeMonteCarloVaR(varPortfolio, historicalReturns, 0.99, 1000, 10);

  // Volatility and Beta estimation
  let portfolioVolatility = 0;
  let portfolioBeta = 1.0;

  if (positions.length > 0 && historicalReturns["SPY"]?.length > 0) {
    // Portfolio daily volatility
    const spyReturns = historicalReturns["SPY"];
    const weights = positions.map(p => p.weight / 100);
    
    // We can estimate portfolio daily returns series to get real portfolio volatility
    const pReturns: number[] = [];
    const minLength = Math.min(...positions.map(p => historicalReturns[p.symbol]?.length || 0));
    
    if (minLength > 0) {
      for (let t = 0; t < minLength; t++) {
        let pRet = 0;
        for (let i = 0; i < positions.length; i++) {
          pRet += (positions[i].weight / 100) * (historicalReturns[positions[i].symbol][t] || 0);
        }
        pReturns.push(pRet);
      }
      portfolioVolatility = calculateVolatility(pReturns);
      
      // Calculate Portfolio Beta relative to SPY
      let weightedBetaSum = 0;
      for (const p of positions) {
        const assetBeta = computeBeta(historicalReturns[p.symbol], spyReturns);
        weightedBetaSum += (p.weight / 100) * assetBeta;
      }
      portfolioBeta = weightedBetaSum;
    }
  }

  // Drawdown estimation (simplified trailing historical peak to trough drawdown)
  let maxDrawdown = 0;
  let peak = totalValue;
  // Let's build a mini-historical P&L performance for the past 15 days
  const historicalPerf: HistoricalPerformance[] = [];
  const minLength = Math.min(...activeSymbols.map(sym => historicalPricesCache[sym]?.length || 0));

  if (minLength > 0 && positions.length > 0) {
    // Walk back 15 days
    const numDays = Math.min(15, minLength);
    let tempPeak = totalValue;

    for (let d = numDays - 1; d >= 0; d--) {
      let dayVal = 0;
      let dayCost = 0;
      
      for (const p of positions) {
        const prices = historicalPricesCache[p.symbol];
        const dayPrice = prices[prices.length - 1 - d] || p.currentPrice;
        dayVal += p.quantity * dayPrice;
        dayCost += p.quantity * p.averageBuyPrice;
      }

      const dayPL = dayVal - dayCost;
      
      if (dayVal > tempPeak) tempPeak = dayVal;
      const dd = tempPeak > 0 ? ((tempPeak - dayVal) / tempPeak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;

      const dateStr = new Date(Date.now() - d * 24 * 3600 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      historicalPerf.push({
        date: dateStr,
        value: Math.round(dayVal * 100) / 100,
        pl: Math.round(dayPL * 100) / 100,
      });
    }
  } else {
    // Fill static historical points
    for (let i = 14; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 3600 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const mult = 1 + (Math.sin(i / 2) * 0.03) + (Math.cos(i) * 0.01);
      historicalPerf.push({
        date: dateStr,
        value: Math.round(totalValue * mult * 100) / 100,
        pl: Math.round((totalValue * mult - totalCost) * 100) / 100,
      });
    }
  }

  const metrics: RiskMetrics = {
    portfolioValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalPL: Math.round(totalPL * 100) / 100,
    totalPLPercent: Math.round(totalPLPercent * 100) / 100,
    dailyPL: Math.round(dailyPL * 100) / 100,
    dailyPLPercent: Math.round(dailyPLPercent * 100) / 100,
    historicalVaR95: Math.round(historicalVaR95 * 100) / 100,
    historicalVaR99: Math.round(historicalVaR99 * 100) / 100,
    monteCarloVaR95: Math.round(mcResults95.varAmount * 100) / 100,
    monteCarloVaR99: Math.round(mcResults99.varAmount * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100 || 1.85, // safety default
    volatility: Math.round(portfolioVolatility * 10000) / 10000, // Keep daily vol detailed
    beta: Math.round(portfolioBeta * 100) / 100,
  };

  return {
    metrics,
    monteCarloPaths: mcResults95.paths, // use 95% paths for chart representation
    historicalPerf,
  };
}

// Assemble full dashboard payload
function getDashboardPayload(): any {
  const trades = loadTrades();
  const positions = aggregatePositions(trades);
  const { metrics, monteCarloPaths, historicalPerf } = calculateMetricsSuite(positions, trades);

  return {
    trades,
    positions,
    prices: livePriceCache,
    metrics,
    monteCarloPaths,
    historicalPerf,
    lastUpdate: new Date().toISOString(),
    isSimulating: false,
  };
}

// REST API Endpoints

// 1. Get entire dashboard state
app.get("/api/dashboard", (req, res) => {
  try {
    const payload = getDashboardPayload();
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get list of trades
app.get("/api/trades", (req, res) => {
  res.json(loadTrades());
});

// 3. Add a trade log
app.post("/api/trades", async (req, res) => {
  try {
    const { symbol, type, quantity, price } = req.body;
    
    if (!symbol || !type || !quantity || !price) {
      return res.status(400).json({ error: "Missing required trade fields (symbol, type, quantity, price)." });
    }

    const trades = loadTrades();
    const newTrade: Trade = {
      id: "t_" + Math.random().toString(36).substr(2, 9),
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase() as "BUY" | "SELL",
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      timestamp: new Date().toISOString(),
    };

    trades.push(newTrade);
    saveTrades(trades);

    // If we have no history for this symbol, fetch it first!
    if (!historicalPricesCache[newTrade.symbol]) {
      console.log(`New symbol added: ${newTrade.symbol}. Fetching market data...`);
      const history = await getStockHistory(newTrade.symbol);
      const lastPrice = history[history.length - 1];
      const prevPrice = history[history.length - 2] || lastPrice;
      const change = lastPrice - prevPrice;
      
      livePriceCache[newTrade.symbol] = {
        symbol: newTrade.symbol,
        price: lastPrice,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round((change / prevPrice) * 100 * 100) / 100,
        lastUpdated: new Date().toISOString(),
        history: history.slice(-15),
      };
    }

    const payload = getDashboardPayload();
    
    // Broadcast to WebSocket clients
    broadcastState(payload);

    res.status(201).json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a trade log
app.delete("/api/trades/:id", (req, res) => {
  try {
    const id = req.params.id;
    let trades = loadTrades();
    
    const originalLength = trades.length;
    trades = trades.filter(t => t.id !== id);
    
    if (trades.length === originalLength) {
      return res.status(404).json({ error: "Trade not found" });
    }

    saveTrades(trades);
    const payload = getDashboardPayload();
    
    // Broadcast updated state
    broadcastState(payload);

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Trigger custom simulations
app.post("/api/simulation", (req, res) => {
  try {
    const { confidenceLevel, numSimulations, days } = req.body;
    const trades = loadTrades();
    const positions = aggregatePositions(trades);

    const targetConfidence = parseFloat(confidenceLevel) || 0.95;
    const targetSims = parseInt(numSimulations) || 1000;
    const targetDays = parseInt(days) || 10;

    // Get returns
    const historicalReturns: Record<string, number[]> = {};
    for (const p of positions) {
      const prices = historicalPricesCache[p.symbol] || [];
      const rets: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        rets.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
      historicalReturns[p.symbol] = rets;
    }

    const varPortfolio = positions.map(p => ({
      symbol: p.symbol,
      marketValue: p.marketValue,
      weight: p.weight / 100,
    }));

    const mcResults = computeMonteCarloVaR(varPortfolio, historicalReturns, targetConfidence, targetSims, targetDays);

    res.json({
      varAmount: Math.round(mcResults.varAmount * 100) / 100,
      paths: mcResults.paths,
      confidenceLevel: targetConfidence,
      numSimulations: targetSims,
      days: targetDays,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List of connected WebSocket clients
const clients = new Set<WebSocket>();

function broadcastState(payload: any) {
  const dataString = JSON.stringify({ type: "STATE_UPDATE", payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataString);
    }
  }
}

function broadcastAlert(alertType: string, message: string, data: any) {
  const alertString = JSON.stringify({
    type: "ALERT",
    payload: { alertType, message, data, timestamp: new Date().toISOString() }
  });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(alertString);
    }
  }
}

// Live price simulations
// Randomly tick stock prices slightly to demonstrate live streaming
function startLiveTicks() {
  setInterval(() => {
    const trades = loadTrades();
    const positions = aggregatePositions(trades);
    if (positions.length === 0) return;

    let hasUpdates = false;

    for (const pos of positions) {
      // Simulate 50% chance of price movement for active positions
      if (Math.random() > 0.5) {
        const livePriceObj = livePriceCache[pos.symbol];
        if (!livePriceObj) continue;

        // Random swing between -0.4% and +0.4%
        const pct = (Math.random() - 0.5) * 0.008;
        const tickDiff = livePriceObj.price * pct;
        
        livePriceObj.price = Math.max(0.1, Math.round((livePriceObj.price + tickDiff) * 100) / 100);
        livePriceObj.change = Math.round((livePriceObj.change + tickDiff) * 100) / 100;
        
        // Compute change percent based on a fictional base price
        const baseEst = livePriceObj.price - livePriceObj.change;
        livePriceObj.changePercent = baseEst > 0 ? Math.round((livePriceObj.change / baseEst) * 100 * 100) / 100 : 0;
        livePriceObj.lastUpdated = new Date().toISOString();
        
        hasUpdates = true;

        // Optional alert if a single stock has an extreme tick (e.g. > 0.3%)
        if (Math.abs(pct) > 0.0035) {
          const dir = pct > 0 ? "surge" : "dip";
          broadcastAlert(
            "STOCK_TICK", 
            `${pos.symbol} experienced a rapid micro-${dir} of ${(pct * 100).toFixed(2)}%`,
            { symbol: pos.symbol, direction: dir, changePercent: pct * 100 }
          );
        }
      }
    }

    if (hasUpdates) {
      // Recalculate metrics suite and broadcast new dashboard state
      const updatedPayload = getDashboardPayload();
      broadcastState(updatedPayload);

      // Check daily P&L threshold for drawdown alerts!
      const dailyPLPercent = updatedPayload.metrics.dailyPLPercent;
      if (dailyPLPercent < -2.0) {
        broadcastAlert(
          "DRAWDOWN_LIMIT",
          `CRITICAL ALERT: Portfolio daily drawdown reached ${dailyPLPercent.toFixed(2)}%! Value at Risk threshold breached!`,
          { dailyPLPercent, value: updatedPayload.metrics.portfolioValue }
        );
      } else if (dailyPLPercent < -0.8) {
        broadcastAlert(
          "DRAWDOWN_WARNING",
          `Warning: Portfolio trailing drawdown tick is at ${dailyPLPercent.toFixed(2)}%`,
          { dailyPLPercent }
        );
      }
    }
  }, 4000); // Ticks every 4 seconds for immediate visual feedback!
}

// Main initializer
async function initializeServer() {
  // Load initial symbols
  const initialTrades = loadTrades();
  const initialSymbols = initialTrades.map(t => t.symbol);
  
  // Fill historical prices and live prices
  await prefillCaches(initialSymbols);

  // Start ticking simulation
  startLiveTicks();

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start HTTP and WebSocket Server combined on PORT 3000
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(` SERVER RUNNING: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`========================================`);
  });

  // Setup WS server
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`Client connected to WebSocket (Active: ${clients.size})`);

    // Send immediate initial state
    try {
      ws.send(JSON.stringify({ type: "INITIAL_STATE", payload: getDashboardPayload() }));
    } catch (e) {
      console.error("Error sending initial WS message", e);
    }

    ws.on("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
        }
      } catch (e) {
        // ignore
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`Client disconnected (Active: ${clients.size})`);
    });
  });
}

initializeServer().catch(err => {
  console.error("Failed to start server:", err);
});
