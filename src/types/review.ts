export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  source: "google-play" | "app-store";
  appId: string;
  appName: string;
}

export interface ReviewCluster {
  id: string;
  theme: string;
  summary: string;
  reviews: Review[];
  averageRating: number;
  count: number;
}

export interface AppAnalysis {
  appId: string;
  appName: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  clusters: ReviewCluster[];
  lastUpdated: string;
}

// Competitive analysis extensions
export interface CompetitiveInsight {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "threat";
  category: string;
  description: string;
  evidence: string[]; // brief strings referencing themes or ratings
  priority: "high" | "medium" | "low";
  theme?: string; // primary theme referenced
  yourRating?: number;
  competitorRating?: number;
  ratingDelta?: number; // your - competitor
  yourCount?: number; // occurrences / review mentions
  competitorCount?: number;
  sentiment?: "positive" | "neutral" | "negative";
  confidence?: number; // 0-1 model confidence if provided
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  category: string; // feature, ux, performance, marketing, etc.
  basedOn: string[]; // ids of insights or clusters
  metric?: string; // primary KPI to move (e.g. crashRate, mediaQualityRating)
  expectedImpact?: string; // qualitative impact statement
  targetDelta?: string; // e.g. "+0.3 rating in media quality"
  timeframe?: string; // e.g. "short-term", "1-2 sprints", etc.
  basedOnThemes?: string[]; // referenced themes
}

export interface MarketPosition {
  rank: number; // ranking by average rating among set
  totalApps: number;
  ratingComparison: "above" | "below" | "average";
  volumeComparison: "above" | "below" | "average";
  uniqueStrengths: string[]; // themes where user app outperforms
  competitiveGaps: string[]; // themes where competitors lead
}

export interface CompetitiveAnalysis {
  yourApp: AppAnalysis;
  competitor: AppAnalysis;
  insights: CompetitiveInsight[];
  recommendations: Recommendation[];
  marketPosition: MarketPosition;
  themeComparisons?: ThemeComparison[]; // shared themes with rating deltas
  summary?: ComparisonSummary; // quick numeric deltas
  lastUpdated: string;
}

export interface ThemeComparison {
  theme: string;
  yourRating: number;
  competitorRating: number;
  delta: number; // yourRating - competitorRating
  yourCount: number;
  competitorCount: number;
  classification: 'advantage' | 'parity' | 'gap';
}

export interface ComparisonSummary {
  ratingDelta: number; // your - competitor
  volumeDelta: number; // your - competitor review count
  advantages: number; // count of advantage themes
  gaps: number; // count of gap themes
}
