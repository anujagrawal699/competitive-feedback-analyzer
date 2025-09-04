import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitive } from '@/lib/analyzer';

export async function POST(request: NextRequest) {
  try {
    const { yourAppId, competitorId, source } = await request.json();

    if (!yourAppId || !competitorId) {
      return NextResponse.json(
        { error: 'yourAppId and competitorId are required' },
        { status: 400 }
      );
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timeout - the request took too long')), 25000)
    );

    const analysisPromise = analyzeCompetitive(yourAppId, competitorId, source || 'google-play');
    
    const analysis = await Promise.race([analysisPromise, timeoutPromise]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    let errorMessage = 'Failed to perform competitive analysis';
    let details = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        errorMessage = 'Request timed out';
        details = 'The analysis took too long, likely due to network restrictions. Try using Google Play Store instead.';
      } else if (error.message.includes('CORS') || error.message.includes('network restrictions')) {
        errorMessage = 'Network restriction error';
        details = 'App Store data fetching may be restricted in the deployment environment. Google Play Store should work fine.';
      } else if (error.message.includes('not found in') && error.message.includes('App Store')) {
        errorMessage = 'App not found';
        details = error.message;
      } else if (error.message.includes('No reviews found')) {
        errorMessage = 'No reviews available';
        details = error.message;
      } else if (error.message.includes('not found')) {
        errorMessage = 'App not found';
        details = error.message;
      } else if (error.message.includes('quota') || error.message.includes('Too Many Requests')) {
        errorMessage = 'AI service temporarily unavailable';
        details = 'AI analysis quota exceeded. Please try again later or contact support.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: details,
        suggestion: error instanceof Error && error.message.includes('App Store') 
          ? 'Try using Google Play Store apps instead, which work more reliably in the deployment environment.'
          : undefined
      },
      { status: 500 }
    );
  }
}
