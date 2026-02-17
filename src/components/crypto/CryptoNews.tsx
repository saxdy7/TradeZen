'use client';

import { useEffect, useState } from 'react';
import { fetchCryptoNews, type CryptoNewsItem } from '@/lib/binance';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';

interface CryptoNewsProps {
  maxItems?: number;
}

export default function CryptoNews({ maxItems = 10 }: CryptoNewsProps) {
  const [news, setNews] = useState<CryptoNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async () => {
    setLoading(true);
    const items = await fetchCryptoNews();
    setNews(items.slice(0, maxItems));
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
    const interval = window.setInterval(loadNews, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [maxItems]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const kindColors: Record<string, string> = {
    news: 'text-[#00D4FF] bg-[#00D4FF]/10',
    media: 'text-[#9B59B6] bg-[#9B59B6]/10',
    analysis: 'text-[#FFD93D] bg-[#FFD93D]/10',
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#00D4FF]" />
          Crypto News
        </h2>
        <button onClick={loadNews} disabled={loading}
          className="p-1.5 rounded text-[#8888AA] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-thin">
        {loading && news.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8888AA]">No news available</div>
        ) : (
          news.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs text-white leading-relaxed line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#8888AA]">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{timeAgo(item.publishedAt)}</span>
                  {item.kind && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${kindColors[item.kind] || 'text-[#8888AA] bg-white/5'}`}>
                      {item.kind}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-[#8888AA] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
            </a>
          ))
        )}
      </div>
    </div>
  );
}
