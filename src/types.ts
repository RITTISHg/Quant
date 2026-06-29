export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  marketValue: number;
  plAmount: number;
  plPercentage: number;
  weight: number;
  sector: string;
  name: string;
}

export interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  history?: number[];
}

export interface RiskMetrics {
  portfolioValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  dailyPL: number;
  dailyPLPercent: number;
  historicalVaR95: number;
  historicalVaR99: number;
  monteCarloVaR95: number;
  monteCarloVaR99: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
}

export interface MonteCarloPath {
  day: number;
  [key: string]: number;
}

export interface HistoricalPerformance {
  date: string;
  value: number;
  pl: number;
}

export interface DashboardState {
  trades: Trade[];
  positions: Position[];
  prices: Record<string, LivePrice>;
  metrics: RiskMetrics;
  monteCarloPaths: MonteCarloPath[];
  historicalPerf: HistoricalPerformance[];
  lastUpdate: string;
  isSimulating: boolean;
}

export const SECTOR_MAP: Record<string, { sector: string; name: string }> = {
  AAPL: { sector: 'Technology', name: 'Apple Inc.' },
  MSFT: { sector: 'Technology', name: 'Microsoft Corporation' },
  GOOGL: { sector: 'Technology', name: 'Alphabet Inc.' },
  AMZN: { sector: 'Consumer Cyclical', name: 'Amazon.com Inc.' },
  TSLA: { sector: 'Consumer Cyclical', name: 'Tesla Inc.' },
  NVDA: { sector: 'Technology', name: 'NVIDIA Corporation' },
  META: { sector: 'Technology', name: 'Meta Platforms Inc.' },
  JPM: { sector: 'Financial Services', name: 'JPMorgan Chase & Co.' },
  V: { sector: 'Financial Services', name: 'Visa Inc.' },
  JNJ: { sector: 'Healthcare', name: 'Johnson & Johnson' },
  WMT: { sector: 'Consumer Defensive', name: 'Walmart Inc.' },
  XOM: { sector: 'Energy', name: 'Exxon Mobil Corporation' },
  DIS: { sector: 'Communication Services', name: 'The Walt Disney Company' },
  KO: { sector: 'Consumer Defensive', name: 'The Coca-Cola Company' },
  SPY: { sector: 'Index', name: 'SPDR S&P 500 ETF Trust' },
};
