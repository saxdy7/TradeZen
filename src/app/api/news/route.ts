import { NextResponse } from 'next/server';
import type { CryptoNewsItem } from '@/lib/binance';

// Try multiple free crypto news sources server-side to avoid CORS
async function fetchFromCryptoPanic(): Promise<CryptoNewsItem[]> {
    const res = await fetch(
        'https://cryptopanic.com/api/free/v1/posts/?public=true&kind=news&regions=en',
        { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`CryptoPanic HTTP ${res.status}`);
    const json = await res.json();
    return (json.results || []).slice(0, 20).map((item: {
        title: string; url: string; domain?: string;
        source?: { domain: string }; published_at: string; kind: string;
    }) => ({
        title: item.title,
        url: item.url,
        source: item.source?.domain || item.domain || 'CryptoPanic',
        publishedAt: item.published_at,
        kind: item.kind || 'news',
    }));
}

async function fetchFromRSS(): Promise<CryptoNewsItem[]> {
    // Use rss2json to convert CoinDesk RSS to JSON — no API key needed
    const rssUrl = encodeURIComponent('https://www.coindesk.com/arc/outboundfeeds/rss/');
    const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=20`,
        { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`RSS2JSON HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error('RSS2JSON error');
    return (json.items || []).map((item: {
        title: string; link: string; pubDate: string;
    }) => ({
        title: item.title,
        url: item.link,
        source: 'CoinDesk',
        publishedAt: item.pubDate,
        kind: 'news' as const,
    }));
}

async function fetchFromCryptoPanicNoKey(): Promise<CryptoNewsItem[]> {
    // Alternative: direct CryptoPanic with no token (public feed)
    const res = await fetch(
        'https://cryptopanic.com/api/free/v1/posts/?public=true',
        { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.results || []).slice(0, 20).map((item: {
        title: string; url: string; source?: { domain: string }; published_at: string; kind: string;
    }) => ({
        title: item.title,
        url: item.url,
        source: item.source?.domain || 'Crypto News',
        publishedAt: item.published_at,
        kind: item.kind || 'news',
    }));
}

export async function GET() {
    // Try sources in order, fall back to next if one fails
    const sources = [fetchFromCryptoPanic, fetchFromCryptoPanicNoKey, fetchFromRSS];
    for (const fetchFn of sources) {
        try {
            const items = await fetchFn();
            if (items.length > 0) {
                return NextResponse.json(items, {
                    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
                });
            }
        } catch {
            // try next source
        }
    }
    return NextResponse.json([], { status: 200 });
}
