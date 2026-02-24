'use client';

import { useEffect, useState } from 'react';
import type { CryptoNewsItem } from '@/lib/binance';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';

interface CryptoNewsProps {
  maxItems?: number;
}

export default function CryptoNews({ maxItems = 10 }: CryptoNewsProps) {
  const [news, setNews] = useState<CryptoNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async () => {
    setLoading(true);
    try {
      // Fetch via server-side API route to avoid CORS / missing auth_token issues
      const res = await fetch('/api/news');
      if (res.ok) {
        const items: CryptoNewsItem[] = await res.json();
        setNews(items.slice(0, maxItems));
      }
    } catch {
      // silently fail — news section shows empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    const interval = window.setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-6 h-6 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
            <p className="text-[10px] text-[#555]">Loading news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Newspaper className="w-8 h-8 text-[#8888AA]/30 mx-auto" />
            <p className="text-xs text-[#8888AA]">No news available</p>
            <button onClick={loadNews} className="text-[10px] text-[#00FF88] hover:underline">Try again</button>
          </div>
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
