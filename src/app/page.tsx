"use client";

import { useState, useMemo } from "react";
import {
  Star,
  TrendingUp,
  MessageSquare,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { CompetitiveAnalysis } from "@/types/review";
import ClusterCard from "../components/ClusterCard";
import InsightCard from "../components/InsightCard";

export default function Home() {
  const [source, setSource] = useState<"google-play" | "app-store">("google-play");
  const [yourAppId, setYourAppId] = useState("");
  const [competitorId, setCompetitorId] = useState("");
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [themeFilter, setThemeFilter] = useState<'all'|'advantage'|'parity'|'gap'>('all');

  const analyzeCompetitive = async () => {
    if (!yourAppId.trim()) return;
  if (!competitorId.trim()) { setError("Enter competitor app ID"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ yourAppId: yourAppId.trim(), competitorId: competitorId.trim(), source })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed competitive analysis');
      }
      const data: CompetitiveAnalysis = await response.json();
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
                <span>Competitive Feedback Analyzer</span>
                <Sparkles className="w-4 h-4 text-violet-500" />
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Analyze competitor app reviews and feedback
              </p>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid lg:grid-cols-6 gap-4">
              <div className="md:col-span-2 flex bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSource("google-play")}
                  className={`flex-1 text-sm font-medium py-2 transition ${
                    source === "google-play"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Google Play
                </button>
                <button
                  onClick={() => setSource("app-store")}
                  className={`flex-1 text-sm font-medium py-2 transition ${
                    source === "app-store"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  App Store
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <label className="text-[11px] font-medium text-slate-500">Your App ID</label>
                <input type="text" value={yourAppId} onChange={e=>setYourAppId(e.target.value)} placeholder={source==='google-play'?'com.whatsapp':'310633997'} className="mt-1 w-full px-2 py-1.5 border border-slate-200 text-indigo-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <label className="text-[11px] font-medium text-slate-500">Competitor App ID</label>
                <input type="text" value={competitorId} onChange={e=>setCompetitorId(e.target.value)} placeholder={source==='google-play'?'com.instagram.android':'389801252'} className="mt-1 w-full px-2 py-1.5 border border-slate-200 text-indigo-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={analyzeCompetitive}
                  disabled={loading || !yourAppId.trim()}
                  className="flex-1 flex items-center justify-center text-sm font-medium py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span className="ml-1">
                    {loading ? "Analyzing" : "Compare"}
                  </span>
                </button>
                {analysis && (
                  <button
                    onClick={() => setAnalysis(null)}
                    className="px-3 flex items-center justify-center rounded-lg py-2 border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Error message */}
            {error && (
              <div className="mt-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        {!analysis && (
          <section className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-10 text-white shadow-md">
              <h2 className="text-3xl font-semibold mb-4 leading-tight">
                Head-to-head product review comparison
              </h2>
              <p className="text-indigo-100 text-sm mb-6 max-w-xl">
                Enter your app and one competitor to see relative strengths, weaknesses, and actionable opportunities.
              </p>
              <ul className="grid md:grid-cols-2 gap-3 text-sm">
                <li className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>Theme comparison</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span>Rating delta</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-sky-200" />
                  <span>Shared vs unique themes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-200" />
                  <span>AI recommendations</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
      Examples
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Google Play Store
                    </p>
                    <div className="text-xs text-slate-400 mb-2">Format: com.company.app</div>
                    <div className="flex flex-col space-y-1">
          <button onClick={()=>{setSource('google-play'); setYourAppId('com.whatsapp'); setCompetitorId('com.instagram.android');}} className="text-left text-indigo-600 hover:underline text-sm">WhatsApp vs Instagram</button>
          <button onClick={()=>{setSource('google-play'); setYourAppId('com.spotify.music'); setCompetitorId('com.apple.android.music');}} className="text-left text-indigo-600 hover:underline text-sm">Spotify vs Apple Music</button>
          <button onClick={()=>{setSource('google-play'); setYourAppId('com.netflix.mediaclient'); setCompetitorId('com.amazon.avod.thirdpartyclient');}} className="text-left text-indigo-600 hover:underline text-sm">Netflix vs Prime Video</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Apple App Store
                    </p>
                    <div className="text-xs text-slate-400 mb-2">Format: numerical ID</div>
                    <div className="flex flex-col space-y-1">
          <button onClick={()=>{setSource('app-store'); setYourAppId('310633997'); setCompetitorId('389801252');}} className="text-left text-indigo-600 hover:underline text-sm">WhatsApp (310633997) vs Instagram</button>
          <button onClick={()=>{setSource('app-store'); setYourAppId('324684580'); setCompetitorId('1108187390');}} className="text-left text-indigo-600 hover:underline text-sm">Spotify vs Apple Music</button>
          <button onClick={()=>{setSource('app-store'); setYourAppId('363590051'); setCompetitorId('545519333');}} className="text-left text-indigo-600 hover:underline text-sm">Netflix vs Prime Video</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Tips:</strong> Compare direct competitors for sharper insights. Find app IDs in store URLs.
                </p>
                <p className="text-[10px] text-slate-400">
                  Google Play: play.google.com/store/apps/details?id=<strong>com.example.app</strong><br/>
                  App Store: apps.apple.com/app/id<strong>123456789</strong>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {analysis && (
          <section className="space-y-8">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <Metric label="Your Rating" value={analysis.yourApp.averageRating.toFixed(1)} icon={<Star className="w-5 h-5 text-yellow-500" />} />
                    <Metric label="Your Reviews" value={analysis.yourApp.totalReviews.toLocaleString()} icon={<MessageSquare className="w-5 h-5 text-indigo-500" />} />
                    <Metric label="Competitor Rating" value={analysis.competitor.averageRating.toFixed(1)} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                    <Metric label="Rank" value={`${analysis.marketPosition.rank}/${analysis.marketPosition.totalApps}`} icon={<Sparkles className="w-5 h-5 text-violet-500" />} />
                  </div>
                  {analysis.summary && (
                    <div className="mt-4 grid sm:grid-cols-4 gap-3 text-xs">
                      <SummaryBadge label="Rating Δ" value={analysis.summary.ratingDelta.toFixed(2)} positive={analysis.summary.ratingDelta>=0} />
                      <SummaryBadge label="Volume Δ" value={analysis.summary.volumeDelta.toLocaleString()} positive={analysis.summary.volumeDelta>=0} />
                      <SummaryBadge label="Advantages" value={analysis.summary.advantages.toString()} positive={analysis.summary.advantages>0} />
                      <SummaryBadge label="Gaps" value={analysis.summary.gaps.toString()} positive={false} />
                    </div>
                  )}
                </div>
                {/* Rating Delta */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Rating Comparison</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-medium tracking-wide text-slate-500 mb-1">Your App</p>
                      <p className="text-2xl font-semibold text-slate-900">{analysis.yourApp.averageRating.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">{analysis.yourApp.totalReviews.toLocaleString()} reviews</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-medium tracking-wide text-slate-500 mb-1">Competitor</p>
                      <p className="text-2xl font-semibold text-slate-900">{analysis.competitor.averageRating.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">{analysis.competitor.totalReviews.toLocaleString()} reviews</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="font-medium text-slate-700">Delta: </span>
                    <span className={
                      analysis.yourApp.averageRating >= analysis.competitor.averageRating
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }>
                      {(analysis.yourApp.averageRating - analysis.competitor.averageRating).toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* Themes comparison side-by-side */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">{analysis.yourApp.appName || 'Your App'} Themes</h3>
                    <div className="space-y-4">
                      {analysis.yourApp.clusters.map((cl,i)=>(
                        <ClusterCard key={cl.id} cluster={cl} rank={i+1} snippetChars={200} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">{analysis.competitor.appName || 'Competitor'} Themes</h3>
                    <div className="space-y-4">
                      {analysis.competitor.clusters.map((cl,i)=>(
                        <ClusterCard key={cl.id} cluster={cl} rank={i+1} snippetChars={200} titleSuffix="(comp)" />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Shared Theme Comparison Table */}
                {analysis.themeComparisons && analysis.themeComparisons.length>0 && (
                  <ThemeComparisonTable
                    comparisons={analysis.themeComparisons}
                    filter={themeFilter}
                    onFilterChange={setThemeFilter}
                  />
                )}
              </div>
              {/* Side panel */}
              <aside className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center justify-between">AI Insights <span className="text-[10px] font-normal text-slate-400">Top {Math.min(analysis.insights.length,6)}</span></h4>
                  <div className="space-y-3">
                    {analysis.insights.slice(0,6).map(ins=>(
                      <InsightCard key={ins.id} insight={ins} />
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-sm">
                  <h4 className="text-sm font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {analysis.recommendations.slice(0,5).map(rec=>(
                      <div key={rec.id} className="bg-white/10 rounded-lg p-3 text-[11px] backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white/90">{rec.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide ${rec.impact==='high'?'bg-emerald-500/30 text-emerald-100':rec.impact==='low'?'bg-slate-500/30 text-slate-100':'bg-amber-500/30 text-amber-100'}`}>{rec.impact}</span>
                        </div>
                        <p className="text-indigo-100 leading-relaxed mb-1 line-clamp-3">{rec.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.metric && <span className="px-2 py-0.5 rounded bg-violet-600/40 text-[9px] font-medium">{rec.metric}</span>}
                          {rec.targetDelta && <span className="px-2 py-0.5 rounded bg-indigo-600/40 text-[9px] font-medium">{rec.targetDelta}</span>}
                          {rec.timeframe && <span className="px-2 py-0.5 rounded bg-fuchsia-600/40 text-[9px] font-medium">{rec.timeframe}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white/60 backdrop-blur py-4 text-center text-xs text-slate-500">
        Built with ❤️ to showcase competetion analysis feedback  for enterpret.
      </footer>
    </div>
  );
}

// Small metric component embedded for readability
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center space-x-3 bg-slate-50 rounded-xl px-4 py-3">
      <div className="h-9 w-9 rounded-lg bg-white shadow flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase font-medium tracking-wide text-slate-500">
          {label}
        </p>
        <p className="text-lg font-semibold text-slate-900 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryBadge({label, value, positive}:{label:string; value:string; positive:boolean}) {
  return (
    <div className={`flex flex-col rounded-lg border px-3 py-2 ${positive? 'border-emerald-200 bg-emerald-50':'border-slate-200 bg-slate-50'}`}>
      <span className="text-[10px] uppercase tracking-wide font-medium text-slate-500 mb-0.5">{label}</span>
      <span className={`text-sm font-semibold ${positive?'text-emerald-700':'text-slate-700'}`}>{value}</span>
    </div>
  );
}

interface ThemeComparisonTableProps {
  comparisons: NonNullable<CompetitiveAnalysis['themeComparisons']>;
  filter: 'all'|'advantage'|'parity'|'gap';
  onFilterChange: (f:'all'|'advantage'|'parity'|'gap')=>void;
}

function ThemeComparisonTable({ comparisons, filter, onFilterChange }: ThemeComparisonTableProps) {
  const filtered = useMemo(()=> filter==='all'? comparisons : comparisons.filter(c=>c.classification===filter), [comparisons, filter]);
  const maxAbsDelta = useMemo(()=> Math.max(0.4, ...comparisons.map(c=> Math.abs(c.delta))), [comparisons]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Shared Themes Performance</h3>
        <div className="flex items-center gap-1 text-[11px]">
          {(['all','advantage','parity','gap'] as const).map(opt=> (
            <button
              key={opt}
              onClick={()=>onFilterChange(opt)}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-medium tracking-wide transition ${filter===opt? 'bg-indigo-600 border-indigo-600 text-white':'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >{opt}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4 font-medium">Theme</th>
              <th className="py-2 pr-4 font-medium">Your</th>
              <th className="py-2 pr-4 font-medium">Comp</th>
              <th className="py-2 pr-4 font-medium">Δ</th>
              <th className="py-2 pr-4 font-medium">Bar</th>
              <th className="py-2 pr-4 font-medium">Your Cnt</th>
              <th className="py-2 pr-4 font-medium">Comp Cnt</th>
              <th className="py-2 pr-4 font-medium">Class</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tc => {
              const ratio = Math.min(1, Math.abs(tc.delta)/maxAbsDelta);
              const barWidth = `${Math.round(ratio*100)}%`;
              const positive = tc.delta >= 0;
              return (
                <tr key={tc.theme} className={`border-b last:border-b-0 border-slate-100 ${tc.classification==='advantage'?'bg-emerald-50/40':tc.classification==='gap'?'bg-rose-50/40':''}`}>
                  <td className="py-1.5 pr-4 font-medium text-slate-700">{tc.theme}</td>
                  <td className="py-1.5 pr-4">{tc.yourRating.toFixed(2)}</td>
                  <td className="py-1.5 pr-4">{tc.competitorRating.toFixed(2)}</td>
                  <td className={`py-1.5 pr-4 font-semibold ${positive?'text-emerald-600':'text-rose-600'}`}>{tc.delta.toFixed(2)}</td>
                  <td className="py-1.5 pr-4">
                    <div className="w-28 h-2 bg-slate-100 rounded relative overflow-hidden">
                      <div className={`h-full ${positive?'bg-emerald-500':'bg-rose-500'}`} style={{width: barWidth}} />
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white/80 mix-blend-difference">
                        {barWidth}
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 pr-4 text-slate-500">{tc.yourCount}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{tc.competitorCount}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${tc.classification==='advantage'?'bg-emerald-100 text-emerald-700':tc.classification==='gap'?'bg-rose-100 text-rose-700':'bg-slate-100 text-slate-600'}`}>{tc.classification}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
