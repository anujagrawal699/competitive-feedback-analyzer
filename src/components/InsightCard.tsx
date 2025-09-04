import { CompetitiveInsight } from "../types/review";
import { ArrowUpRight, ArrowDownRight, Minus, Star, Activity } from "lucide-react";

interface InsightCardProps {
  insight: CompetitiveInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  const delta = insight.ratingDelta;
  const hasDelta = typeof delta === 'number' && !isNaN(delta);
  const positive = hasDelta ? delta >= 0.05 : false;
  const negative = hasDelta ? delta <= -0.05 : false;
  const Indicator = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
            insight.type === 'strength' ? 'bg-emerald-100 text-emerald-700' :
            insight.type === 'weakness' ? 'bg-rose-100 text-rose-700' :
            insight.type === 'opportunity' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
          }`}>{insight.type}</span>
          {insight.priority && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              insight.priority==='high'?'bg-red-100 text-red-700': insight.priority==='low'?'bg-slate-100 text-slate-600':'bg-orange-100 text-orange-700'
            }`}>{insight.priority}</span>
          )}
        </div>
        {hasDelta && (
          <div className={`flex items-center space-x-1 text-xs font-semibold ${positive?'text-emerald-600':negative?'text-rose-600':'text-slate-500'}`}>
            <Indicator className="w-3 h-3" />
            <span>{delta!>0?'+':''}{delta!.toFixed(2)}</span>
          </div>
        )}
      </div>
      <p className="text-[13px] text-slate-800 leading-relaxed mb-2">{insight.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {insight.theme && (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">{insight.theme}</span>
        )}
        {insight.category && (
          <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium">{insight.category}</span>
        )}
        {insight.sentiment && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            insight.sentiment==='positive'?'bg-emerald-100 text-emerald-700': insight.sentiment==='negative'?'bg-rose-100 text-rose-700':'bg-sky-100 text-sky-700'
          }`}>{insight.sentiment}</span>
        )}
        {typeof insight.confidence==='number' && (
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium">conf {(insight.confidence*100).toFixed(0)}%</span>
        )}
      </div>

      {(insight.yourRating !== undefined || insight.competitorRating !== undefined) && (
        <div className="flex items-center space-x-2 mb-2">
          {insight.yourRating !== undefined && (
            <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600"><Star className="w-3 h-3 text-yellow-500" /> <span>{insight.yourRating.toFixed(2)}</span></span>
          )}
          {insight.competitorRating !== undefined && (
            <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500"><Star className="w-3 h-3 text-slate-400" /> <span>{insight.competitorRating.toFixed(2)}</span></span>
          )}
          {hasDelta && <span className={`text-[11px] font-medium ${positive?'text-emerald-600':negative?'text-rose-600':'text-slate-500'}`}>{delta!>0?'+':''}{delta!.toFixed(2)}</span>}
        </div>
      )}

      {(insight.yourCount !== undefined || insight.competitorCount !== undefined) && (
        <div className="flex items-center space-x-2 mb-2">
          {insight.yourCount !== undefined && (
            <span className="inline-flex items-center space-x-1 text-[10px] text-slate-600"><Activity className="w-3 h-3" /> <span>you {insight.yourCount}</span></span>
          )}
          {insight.competitorCount !== undefined && (
            <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500"><Activity className="w-3 h-3" /> <span>comp {insight.competitorCount}</span></span>
          )}
        </div>
      )}

      {insight.evidence?.length>0 && (
        <ul className="mt-2 space-y-1">
          {insight.evidence.slice(0,3).map((e,i)=>(
            <li key={i} className="text-[11px] text-slate-500 flex">
              <span className="mr-1">•</span>
              <span className="line-clamp-2">{e}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
