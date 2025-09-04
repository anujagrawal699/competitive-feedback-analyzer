import { Review } from "@/types/review";

export async function scrapeAppStoreReviews(
  appId: string,
  country: string = "us",
  num: number = 200
): Promise<Review[]> {
  console.log(`Fetching ${num} App Store reviews for ${appId}...`);

  const reviews: Review[] = [];
  // Limit pages for serverless deployment to avoid timeouts
  const maxPages = Math.min(Math.ceil(num / 50), 3); // Max 3 pages for reliability
  
  for (let page = 1; page <= maxPages && reviews.length < num; page++) {
    const rssUrl = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/xml`;

    try {
      // Add timeout and better headers for serverless environments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(rssUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timeoutId);

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
      
      // Shorter delay for serverless environments
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timeout for page ${page}, stopping fetch`);
        if (page === 1) {
          throw new Error(`App Store request timed out for app ${appId}. This may be due to network restrictions in the deployment environment.`);
        }
        break;
      }
      
      if (page === 1) {
        // If first page fails, provide better error message
        if (error instanceof Error && error.message.includes('fetch')) {
          throw new Error(`Network error fetching App Store data for ${appId}. This may be due to CORS or network restrictions in the deployment environment.`);
        }
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
  
  // Add timeout for serverless environments
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

  try {
    const response = await fetch(lookupUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout fetching App Store app details for ${appId}. This may be due to network restrictions in the deployment environment.`);
    }
    throw error;
  }
}
