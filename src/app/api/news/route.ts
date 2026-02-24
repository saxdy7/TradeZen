import { NextResponse } from 'next/server';
import type { CryptoNewsItem } from '@/lib/binance';

// Strip CDATA wrapper if present: <![CDATA[content]]>
function stripCDATA(str: string): string {
    return str.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1').trim();
}

// Get first match + strip CDATA
function extractField(xml: string, tag: string): string {
    // Try CDATA form first
    const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
    if (cdataMatch) return cdataMatch[1].trim();

    // Plain text form
    const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (plainMatch) return stripCDATA(plainMatch[1]).trim();

    return '';
}

// For <link> in RSS, it can appear as:
//   <link>https://...</link>
//   <link><![CDATA[https://...]]></link>
//   <link /> (self-closing, atom) followed by href attr
//   or inside <guid> as a fallback
function extractLink(itemXml: string): string {
    // CDATA form
    const cdataLink = itemXml.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)?.[1];
    if (cdataLink) return cdataLink.trim();

    // Plain <link>...</link>
    const plainLink = itemXml.match(/<link[^>]*>(https?:\/\/[^\s<]+)<\/link>/i)?.[1];
    if (plainLink) return plainLink.trim();

    // Atom <link href="..." />
    const atomLink = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
    if (atomLink) return atomLink.trim();

    // Fallback: <guid>
    const guid = itemXml.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/i)?.[1];
    if (guid) return guid.trim();

    return '';
}

// Decode common HTML entities
function decodeEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#8217;/g, '\u2019')
        .replace(/&#8216;/g, '\u2018')
        .replace(/&#8220;/g, '\u201C')
        .replace(/&#8221;/g, '\u201D');
}

function parseRSS(xml: string, sourceName: string): CryptoNewsItem[] {
    const items: CryptoNewsItem[] = [];
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 8)) {
        const title = decodeEntities(extractField(item, 'title'));
        const link = extractLink(item);
        const pubDate = extractField(item, 'pubDate') || extractField(item, 'published') || new Date().toISOString();

        if (title && link && link.startsWith('http')) {
            items.push({
                title,
                url: link,
                source: sourceName,
                publishedAt: (() => { try { return new Date(pubDate).toISOString(); } catch { return new Date().toISOString(); } })(),
                kind: 'news',
            });
        }
    }
    return items;
}

const RSS_FEEDS = [
    { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph' },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
    { url: 'https://decrypt.co/feed', name: 'Decrypt' },
    { url: 'https://cryptopotato.com/feed/', name: 'CryptoPotato' },
];

async function fetchFeed(feed: { url: string; name: string }): Promise<CryptoNewsItem[]> {
    const res = await fetch(feed.url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TradeZen/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`${feed.name} HTTP ${res.status}`);
    const xml = await res.text();
    return parseRSS(xml, feed.name);
}

export async function GET() {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

    const allItems: CryptoNewsItem[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled') allItems.push(...result.value);
    }

    // Sort by date desc, deduplicate by title prefix
    const seen = new Set<string>();
    const deduped = allItems
        .filter(item => item.title && item.url)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .filter(item => {
            const key = item.title.slice(0, 50).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 20);

    return NextResponse.json(deduped, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
}
