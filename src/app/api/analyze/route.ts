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

    const analysis = await analyzeCompetitive(yourAppId, competitorId, source || 'google-play');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
  error: 'Failed to perform competitive analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
