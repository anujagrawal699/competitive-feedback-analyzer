import { Review, AppAnalysis, CompetitiveAnalysis } from "@/types/review";
import {
  scrapeGooglePlayReviews,
  getAppDetails,
} from "@/lib/google-play-scraper";
import {
  scrapeAppStoreReviews,
  getAppStoreAppDetails,
} from "@/lib/app-store-scraper";
import { analyzeReviewsWithAI, generateCompetitiveAI } from "@/lib/gemini";

async function analyzeSingleApp(appId: string, source: "google-play" | "app-store"): Promise<AppAnalysis> {
  let reviews: Review[] = [];
  let appDetails: { title: string; icon: string; developer: string };

  if (source === "google-play") {
    reviews = await scrapeGooglePlayReviews(appId, "en", "us", 100);
    appDetails = await getAppDetails(appId);
  } else {
    reviews = await scrapeAppStoreReviews(appId, "us", 50);
    appDetails = await getAppStoreAppDetails(appId);
  }

  reviews = reviews.map(r => ({ ...r, appName: appDetails.title }));

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    const rating = Math.max(1, Math.min(5, Math.floor(r.rating + 0.5))) as keyof typeof ratingDistribution;
    ratingDistribution[rating]++;
  });
  const totalRatings = reviews.reduce((s,r)=>s+r.rating,0);
  const averageRating = reviews.length ? totalRatings / reviews.length : 0;
  const clusters = await analyzeReviewsWithAI(reviews);

  return {
    appId,
    appName: appDetails.title,
    totalReviews: reviews.length,
    averageRating,
    ratingDistribution,
    clusters: clusters.slice(0,5),
    lastUpdated: new Date().toISOString(),
  };
}

export async function analyzeCompetitive(
  yourAppId: string,
  competitorId: string,
  source: "google-play" | "app-store" = "google-play"
): Promise<CompetitiveAnalysis> {
  const yourApp = await analyzeSingleApp(yourAppId, source);
  const competitor = await analyzeSingleApp(competitorId, source);

  const { insights, recommendations, marketPosition, themeComparisons, summary } = await generateCompetitiveAI(yourApp, competitor);

  return {
    yourApp,
    competitor,
    insights,
    recommendations,
    marketPosition,
    themeComparisons,
    summary,
    lastUpdated: new Date().toISOString(),
  };
}
