import { Review } from "@/types/review";

export async function scrapeAppStoreReviews(
  appId: string,
  country: string = "us",
  num: number = 200
): Promise<Review[]> {
  console.log(`Fetching ${num} App Store reviews for ${appId}...`);

  const reviews: Review[] = [];
  const maxPages = Math.ceil(num / 50); // Each page has ~50 reviews
  
  for (let page = 1; page <= maxPages && reviews.length < num; page++) {
    const rssUrl = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/xml`;

    try {
      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`App Store app not found: ${appId}. Please verify the app ID is correct.`);
        }
        throw new Error(`Failed to fetch App Store reviews: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log(`Page ${page}: Received ${xmlText.length} characters of XML data`);

      const entryMatches = xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/g) || [];
      console.log(`Page ${page}: Found ${entryMatches.length} entry elements`);
      
      // If no entries found, we've reached the end
      if (entryMatches.length === 0) {
        console.log(`No more reviews found after page ${page - 1}`);
        break;
      }

      const pageReviews = parseAppStoreEntries(entryMatches, appId, reviews.length);
      reviews.push(...pageReviews);
      
      // Small delay between requests to be respectful
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      if (page === 1) {
        // If first page fails, rethrow the error
        throw error;
      } else {
        // If subsequent pages fail, just stop fetching
        console.log(`Failed to fetch page ${page}, stopping: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }
  }

  if (reviews.length === 0) {
    throw new Error(`No reviews found for App Store app ${appId}. The app may be new, have no reviews, or the app ID may be incorrect.`);
  }

  console.log(`Successfully parsed ${reviews.length} reviews from App Store`);
  return reviews.slice(0, num);
}

function parseAppStoreEntries(entryMatches: string[], appId: string, startIndex: number): Review[] {
  const reviews: Review[] = [];
  
  entryMatches.forEach((entry, index) => {
    const titleMatch = entry.match(
      /<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/
    );
    const authorMatch = entry.match(/<name[^>]*>(.*?)<\/name>/);
    const contentMatch =
      entry.match(
        /<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/
      ) ||
      entry.match(
        /<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/
      );
    const ratingMatch = entry.match(/im:rating[^>]*>(\d+)</);
    const dateMatch = entry.match(/<updated[^>]*>(.*?)<\/updated>/);

    const title = titleMatch?.[1]?.trim() || "";
    const content = contentMatch?.[1]?.trim() || "";

    // Filter out non-review entries
    if (
      title &&
      content &&
      title !== "iTunes Store: Customer Reviews" &&
      content.length > 10
    ) {
      reviews.push({
        id: `appstore-${appId}-${startIndex + index}`,
        author: authorMatch?.[1]?.trim() || "Anonymous",
        rating: ratingMatch ? parseInt(ratingMatch[1]) : 0,
        date: dateMatch?.[1] || new Date().toISOString(),
        text: content,
        source: "app-store" as const,
        appId,
        appName: "",
      });
    }
  });

  return reviews;
}

export async function getAppStoreAppDetails(
  appId: string
): Promise<{ title: string; icon: string; developer: string }> {
  console.log(`Fetching App Store app details for ${appId}...`);

  const lookupUrl = `https://itunes.apple.com/lookup?id=${appId}`;
  const response = await fetch(lookupUrl);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`App Store app not found: ${appId}. Please verify the app ID is correct.`);
    }
    throw new Error(`Failed to fetch app details: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`App Store app not found: ${appId}. Please verify the app ID is correct.`);
  }

  const app = data.results[0];
  console.log(`Found app: ${app.trackName}`);

  return {
    title: app.trackName || "Unknown App",
    icon: app.artworkUrl100 || "",
    developer: app.artistName || "Unknown Developer",
  };
}
