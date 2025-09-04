import { Review } from "@/types/review";

let gplay: any = null;

async function getGplayModule() {
  if (gplay) return gplay;

  const imported = await import("google-play-scraper");
  const mod = (imported as any).default;

  if (!mod || !mod.reviews || !mod.app) {
    console.error(
      "Module structure issue. Available:",
      mod ? Object.keys(mod) : "none"
    );
    throw new Error("google-play-scraper module missing required functions");
  }

  gplay = mod;
  return gplay;
}

export async function scrapeGooglePlayReviews(
  appId: string,
  lang: string = "en",
  country: string = "us",
  num: number = 100
): Promise<Review[]> {
  const gplayModule = await getGplayModule();

  console.log(`Fetching ${num} Google Play reviews for ${appId}...`);

  try {
    const reviews = await gplayModule.reviews({
      appId,
      lang,
      country,
      sort: gplayModule.sort?.NEWEST || gplayModule.sort?.newest,
      num,
    });

    if (!reviews || !reviews.data || reviews.data.length === 0) {
      throw new Error(`No reviews found for Google Play app ${appId}. The app may be new, have no reviews, or the app ID may be incorrect.`);
    }

    console.log(
      `Successfully fetched ${reviews.data.length} reviews from Google Play`
    );

    return reviews.data.map(
      (
        review: {
          userName?: string;
          score?: number;
          date?: string | Date;
          text?: string;
        },
        index: number
      ) => ({
        id: `gplay-${appId}-${index}`,
        author: review.userName || "Anonymous",
        rating: review.score || 0,
        date: review.date
          ? typeof review.date === "string"
            ? review.date
            : review.date.toISOString()
          : new Date().toISOString(),
        text: review.text || "",
        source: "google-play" as const,
        appId,
        appName: "",
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('App not found')) {
      throw new Error(`Google Play app not found: ${appId}. Please verify the app ID is correct.`);
    }
    throw error;
  }
}

export async function getAppDetails(
  appId: string
): Promise<{ title: string; icon: string; developer: string }> {
  const gplayModule = await getGplayModule();

  console.log(`Fetching app details for ${appId}...`);

  try {
    const appDetails = await gplayModule.app({ appId });

    if (!appDetails) {
      throw new Error(`Google Play app not found: ${appId}. Please verify the app ID is correct.`);
    }

    return {
      title: appDetails.title || "Unknown App",
      icon: appDetails.icon || "",
      developer: appDetails.developer || "Unknown Developer",
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('App not found')) {
      throw new Error(`Google Play app not found: ${appId}. Please verify the app ID is correct.`);
    }
    throw error;
  }
}
