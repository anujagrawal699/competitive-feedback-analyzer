import { GoogleGenerativeAI } from "@google/generative-ai";
import { Review, ReviewCluster, AppAnalysis, CompetitiveAnalysis, CompetitiveInsight, Recommendation, MarketPosition, ThemeComparison, ComparisonSummary } from "@/types/review";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

let windowStart = Date.now();
let callsInWindow = 0;

function underRateLimit(max = 10) {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    callsInWindow = 0;
  }
  return callsInWindow < max;
}

function markCall() {
  callsInWindow++;
}

const aiCache = new Map<string, ReviewCluster[]>();

function cacheKey(reviews: Review[]) {
  return reviews
    .map((r) => r.id)
    .join("|") + ":" + reviews.length;
}

export async function analyzeReviewsWithAI(
  reviews: Review[]
): Promise<ReviewCluster[]> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  if (!underRateLimit()) {
    throw new Error("Rate limit exceeded, please try again later");
  }

  const validReviews = reviews.filter((r) => r.text?.trim().length > 15);
  if (validReviews.length === 0) {
    throw new Error("No valid reviews found for analysis");
  }

  const key = cacheKey(validReviews);
  const cached = aiCache.get(key);
  if (cached) {
    return cached;
  }

  markCall();

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const reviewsBlock = validReviews
    .map(
      (review, index) =>
        `${index + 1}. (${review.rating}★) ${truncate(review.text, 200)}`
    )
    .join("\n");

  const prompt = `Analyze these app reviews and group them into themes. Return ONLY valid JSON with no additional text.

Schema: {"clusters": [{"theme": "", "summary": "", "reviewNumbers": [], "sentiment": "", "avgRating": 0}]}

Rules:
- Maximum 7 themes (only include the most meaningful)
- Summaries under 200 characters (concise but clear, mention key user sentiment + primary driver)
- Include review numbers that match each theme
- Calculate average rating per theme
- Prefer grouping by user value or pain vs technical jargon

Reviews:
${reviewsBlock}

JSON:`;

  const result = await model.generateContent([{ text: prompt }]);
  const responseText = result.response.text().trim();

  const parsed = extractJson(responseText);
  if (!parsed?.clusters || !Array.isArray(parsed.clusters)) {
    throw new Error("Invalid AI response format");
  }

  const clusters: ReviewCluster[] = parsed.clusters
    .slice(0, 6)
    .map((cluster: any, index: number) => {
      const matchedReviews = (cluster.reviewNumbers || [])
        .map((num: number) => validReviews[num - 1])
        .filter(Boolean)
        .slice(0, 5);

      const avgRating =
        cluster.avgRating ||
        (matchedReviews.length > 0
          ? matchedReviews.reduce(
              (sum: number, r: Review) => sum + r.rating,
              0
            ) / matchedReviews.length
          : 0);

      return {
        id: `cluster-${index}`,
        theme: cluster.theme || `Theme ${index + 1}`,
        summary: cluster.summary || "No summary available",
        reviews: matchedReviews,
        averageRating: Number(avgRating.toFixed(1)),
        count: matchedReviews.length,
      };
    });

  clusters.sort((a: ReviewCluster, b: ReviewCluster) => b.count - a.count);
  aiCache.set(key, clusters);

  return clusters;
}

export async function generateCompetitiveAI(
  your: AppAnalysis,
  competitor: AppAnalysis
): Promise<Pick<CompetitiveAnalysis, "insights" | "recommendations" | "marketPosition" | "themeComparisons" | "summary" >> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is required");
  if (!underRateLimit()) throw new Error("Rate limit exceeded");
  markCall();

  const context = {
    yourApp: {
      name: your.appName,
      avg: your.averageRating,
      total: your.totalReviews,
      themes: your.clusters.map(c => ({ t: c.theme, r: c.averageRating, n: c.count }))
    },
    competitor: {
      name: competitor.appName,
      avg: competitor.averageRating,
      total: competitor.totalReviews,
      themes: competitor.clusters.map(cl => ({ t: cl.theme, r: cl.averageRating, n: cl.count }))
    }
  };

  // Derive raw theme comparison table locally to include in prompt
  const themeMap = new Map<string, { your?: ReviewCluster; comp?: ReviewCluster }>();
  your.clusters.forEach(c => themeMap.set(c.theme, { your: c }));
  competitor.clusters.forEach(c => {
    const existing = themeMap.get(c.theme) || {}; existing.comp = c; themeMap.set(c.theme, existing);
  });
  const shared = Array.from(themeMap.entries())
    .filter(([,v]) => v.your && v.comp)
    .map(([theme, v]) => ({
      theme,
      yourRating: v.your!.averageRating,
      competitorRating: v.comp!.averageRating,
      yourCount: v.your!.count,
      competitorCount: v.comp!.count,
      delta: v.your!.averageRating - v.comp!.averageRating
    }));

  const prompt = `You are a product insights assistant.
Given this competitive review analysis data (JSON below), produce JSON ONLY with keys: insights, recommendations, marketPosition.

Rules:
- 6-8 insights. Each object MUST include fields:
  { id(optional), type(strength|weakness|opportunity|threat), category, description(<200 chars), evidence[string...], priority(high|medium|low), theme(optional), yourRating(optional number), competitorRating(optional number), ratingDelta(optional number), yourCount(optional number), competitorCount(optional number), sentiment(optional positive|neutral|negative), confidence(optional 0-1) }
- 5-7 recommendations. Each MUST include:
  { id(optional), title(<70), description(<220), impact(high|medium|low), effort(high|medium|low), category(feature|ux|performance|marketing|retention|growth), basedOn[array of insight indices like i0], metric(optional), expectedImpact(optional short), targetDelta(optional short), timeframe(optional short), basedOnThemes(optional array) }
- marketPosition unchanged: rank, totalApps, ratingComparison, volumeComparison, uniqueStrengths, competitiveGaps
- Ground numeric fields using sharedThemes when possible; set ratingDelta = yourRating - competitorRating.
- If a numeric cannot be derived, omit it (do NOT guess).
- No prose outside JSON.

Data:
${JSON.stringify({ ...context, sharedThemes: shared })}

JSON:`;

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent([{ text: prompt }]);
  const raw = result.response.text().trim();
  let parsed: any;
  try {
    parsed = extractJson(raw);
  } catch (e) {
    // Fallback minimal structure
    parsed = {};
  }

  const insights: CompetitiveInsight[] = (parsed.insights || []).slice(0, 8).map((ins: any, i: number) => ({
    id: `ins-${i}`,
    type: ins.type === 'strength' || ins.type === 'weakness' || ins.type === 'opportunity' || ins.type === 'threat' ? ins.type : 'opportunity',
    category: ins.category || 'general',
    description: ins.description || 'Insight unavailable',
    evidence: Array.isArray(ins.evidence) ? ins.evidence.slice(0, 6) : [],
    priority: ins.priority === 'high' || ins.priority === 'low' ? ins.priority : 'medium',
    theme: typeof ins.theme === 'string' ? ins.theme : undefined,
    yourRating: typeof ins.yourRating === 'number' ? ins.yourRating : undefined,
    competitorRating: typeof ins.competitorRating === 'number' ? ins.competitorRating : undefined,
    ratingDelta: typeof ins.ratingDelta === 'number' ? ins.ratingDelta : (typeof ins.yourRating === 'number' && typeof ins.competitorRating === 'number' ? ins.yourRating - ins.competitorRating : undefined),
    yourCount: typeof ins.yourCount === 'number' ? ins.yourCount : undefined,
    competitorCount: typeof ins.competitorCount === 'number' ? ins.competitorCount : undefined,
    sentiment: ['positive','neutral','negative'].includes(ins.sentiment) ? ins.sentiment : undefined,
    confidence: typeof ins.confidence === 'number' ? Math.max(0, Math.min(1, ins.confidence)) : undefined
  }));

  const recommendations: Recommendation[] = (parsed.recommendations || []).slice(0, 7).map((r: any, i: number) => ({
    id: `rec-${i}`,
    title: r.title || 'Improve User Experience',
    description: r.description || 'Refine onboarding and address key pain themes.',
    impact: r.impact === 'high' || r.impact === 'low' ? r.impact : 'medium',
    effort: r.effort === 'high' || r.effort === 'low' ? r.effort : 'medium',
    category: r.category || 'feature',
    basedOn: Array.isArray(r.basedOn) ? r.basedOn.slice(0, 6) : [],
    metric: typeof r.metric === 'string' ? r.metric : undefined,
    expectedImpact: typeof r.expectedImpact === 'string' ? r.expectedImpact : undefined,
    targetDelta: typeof r.targetDelta === 'string' ? r.targetDelta : undefined,
    timeframe: typeof r.timeframe === 'string' ? r.timeframe : undefined,
    basedOnThemes: Array.isArray(r.basedOnThemes) ? r.basedOnThemes.slice(0,6) : undefined
  }));

  const marketPosition: MarketPosition = {
    rank: parsed.marketPosition?.rank || computeSingleRank(your, competitor),
    totalApps: 2,
    ratingComparison: parsed.marketPosition?.ratingComparison || relativeBucketSingle(your.averageRating, competitor.averageRating),
    volumeComparison: parsed.marketPosition?.volumeComparison || relativeBucketSingle(your.totalReviews, competitor.totalReviews),
    uniqueStrengths: parsed.marketPosition?.uniqueStrengths || deriveUniqueThemesSingle(your, competitor),
    competitiveGaps: parsed.marketPosition?.competitiveGaps || deriveGapThemesSingle(your, competitor)
  };

  // Build theme comparison objects (classification local, not AI)
  const themeComparisons: ThemeComparison[] = shared.map(row => ({
    theme: row.theme,
    yourRating: row.yourRating,
    competitorRating: row.competitorRating,
    delta: row.delta,
    yourCount: row.yourCount,
    competitorCount: row.competitorCount,
    classification: row.delta >= 0.4 ? 'advantage' : row.delta <= -0.4 ? 'gap' : 'parity'
  }));

  const summary: ComparisonSummary = {
    ratingDelta: your.averageRating - competitor.averageRating,
    volumeDelta: your.totalReviews - competitor.totalReviews,
    advantages: themeComparisons.filter(t=>t.classification==='advantage').length,
    gaps: themeComparisons.filter(t=>t.classification==='gap').length
  };

  return { insights, recommendations, marketPosition, themeComparisons, summary };
}

function computeSingleRank(your: AppAnalysis, competitor: AppAnalysis): number {
  return your.averageRating >= competitor.averageRating ? 1 : 2;
}

function relativeBucketSingle(value: number, other: number): "above" | "below" | "average" {
  if (value >= other + 0.05) return 'above';
  if (value <= other - 0.05) return 'below';
  return 'average';
}

function deriveUniqueThemesSingle(your: AppAnalysis, competitor: AppAnalysis): string[] {
  const compMap = new Map(competitor.clusters.map(cl => [cl.theme, cl.averageRating] as const));
  return your.clusters.filter(cl => {
    const other = compMap.get(cl.theme);
    return other !== undefined && cl.averageRating >= other + 0.4;
  }).map(cl => cl.theme).slice(0,5);
}

function deriveGapThemesSingle(your: AppAnalysis, competitor: AppAnalysis): string[] {
  return competitor.clusters.filter(cl => {
    const yourTheme = your.clusters.find(c => c.theme === cl.theme);
    return yourTheme && yourTheme.averageRating <= cl.averageRating - 0.4;
  }).map(cl => cl.theme).slice(0,5);
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function extractJson(text: string): any {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    // Try to find JSON block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If no JSON block found, try parsing the entire text
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Failed to parse AI response as JSON");
  }
}
