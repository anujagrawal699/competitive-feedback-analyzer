import { ReviewCluster } from '@/types/review';
import { Star, MessageSquare } from 'lucide-react';

interface ClusterCardProps {
  cluster: ReviewCluster;
  rank: number;
  snippetChars?: number;
  titleSuffix?: string;
}

export default function ClusterCard({ cluster, rank, snippetChars = 200, titleSuffix }: ClusterCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full">
            {rank}
          </span>
          <h4 className="text-lg font-semibold text-gray-900">{cluster.theme}{titleSuffix && <span className="ml-1 text-xs font-normal text-gray-400">{titleSuffix}</span>}</h4>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{cluster.averageRating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>{cluster.count}</span>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 text-sm leading-relaxed">
        {cluster.summary}
      </p>
      
      {cluster.reviews.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900">Sample Reviews:</h5>
          <div className="space-y-2">
            {cluster.reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-gray-50 rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{review.author}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-gray-600">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 line-clamp-3">
                  {review.text.length > snippetChars 
                    ? `${review.text.substring(0, snippetChars)}...` 
                    : review.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
