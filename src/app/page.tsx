'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  Bell,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Wallet,
  Eye,
  Target,
  Layers,
  Github,
  Twitter,
  Globe,
  CheckCircle2,
  Quote,
  LineChart,
  Lock,
  Rocket,
  Clock,
  Flame,
  GraduationCap,
  Activity,
  X,
  Check,
  Star,
  Play,
  Monitor,
  Smartphone,
  Wifi,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriceTicker from '@/components/crypto/PriceTicker';

// ───── Animated counter hook ─────
function useCounter(end: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, enabled]);
  return count;
}

// ───── Data ─────
const features = [
  {
    icon: TrendingUp,
    title: 'Live Market Data',
    description: 'Real-time streaming prices from Binance WebSocket for 50 crypto pairs with instant updates.',
    color: '#00FF88',
    stats: '50 Coins',
    details: ['WebSocket streaming', '< 100ms latency', 'Price, volume, H/L data'],
  },
  {
    icon: Brain,
    title: 'AI Trading Mentor',
    description: '4 specialized AI personas powered by Llama 3.3 70B — analyst, teacher, trader, degen.',
    color: '#00D4FF',
    stats: '4 Personas',
    details: ['Markdown-rich responses', 'Portfolio-aware advice', 'Quick coin analysis'],
  },
  {
    icon: LineChart,
    title: 'Pro Trading Charts',
    description: 'TradingView-powered charts with RSI, MACD, Bollinger Bands, EMA, and depth chart.',
    color: '#FFD93D',
    stats: '5+ Indicators',
    details: ['Candlestick + area charts', 'Multiple timeframes', 'Order book depth chart'],
  },
  {
    icon: Wallet,
    title: 'Portfolio Manager',
    description: 'Full portfolio tracking with live P&L, analytics panel, performance chart, and CSV export.',
    color: '#FF6B6B',
    stats: 'Real-time P&L',
    details: ['Analytics dashboard', 'Transaction history', 'Sortable holdings table'],
  },
  {
    icon: Bell,
    title: 'Smart Price Alerts',
    description: 'Set price targets for any coin. Get notified when above/below thresholds are hit.',
    color: '#6C5CE7',
    stats: 'Unlimited Alerts',
    details: ['Above/below targets', 'Real-time monitoring', 'Alert history log'],
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    description: 'Supabase auth with Row Level Security. Your data stays private and encrypted.',
    color: '#FD79A8',
    stats: 'RLS Secured',
    details: ['Email/password auth', 'Data encryption', 'Zero data selling'],
  },
];

const proFeatures = [
  {
    icon: '📊',
    title: 'Market Analyst Mode',
    description: 'Multi-timeframe analysis with Fibonacci levels, Elliott Wave, and Ichimoku Cloud interpretation.',
    gradient: 'from-[#00FF88] to-[#00D4FF]',
  },
  {
    icon: '🎓',
    title: 'Crypto Academy',
    description: 'Learn DeFi, chart patterns, risk management, and trading psychology from AI teacher.',
    gradient: 'from-[#00D4FF] to-[#6C5CE7]',
  },
  {
    icon: '💰',
    title: 'Trade Signal Engine',
    description: 'Structured trade cards with entry/TP1-3/SL, R:R ratio, confidence rating, and position sizing.',
    gradient: 'from-[#FFD93D] to-[#FF6B6B]',
  },
  {
    icon: '🔥',
    title: 'Alpha & Narratives',
    description: 'Track emerging narratives — AI tokens, RWA, DePIN — with risk-rated degen calls.',
    gradient: 'from-[#FF6B6B] to-[#FD79A8]',
  },
];

const steps = [
  { num: '01', icon: Eye, title: 'Sign Up Free', description: 'Create your account in seconds with email. No credit card required.', color: '#00FF88' },
  { num: '02', icon: BarChart3, title: 'Explore Markets', description: 'Browse 50+ live crypto pairs with pro charts, depth chart, and real-time data.', color: '#00D4FF' },
  { num: '03', icon: Brain, title: 'Consult AI Mentor', description: 'Switch between 4 AI personas — get analysis, signals, education, or alpha.', color: '#FFD93D' },
  { num: '04', icon: Target, title: 'Track & Manage', description: 'Build your portfolio, set price alerts, and monitor performance in real-time.', color: '#FF6B6B' },
];

const testimonials = [
  { name: 'Alex R.', role: 'Day Trader', avatar: '🧑‍💻', content: 'TradeZen\'s AI mentor helped me understand candlestick patterns in a way no YouTube video ever could. The real-time data is incredibly fast.', rating: 5 },
  { name: 'Priya S.', role: 'Crypto Beginner', avatar: '👩‍🎓', content: 'I was overwhelmed by crypto before TradeZen. The AI breaks down complex concepts into simple, actionable advice. Love the portfolio tracker too!', rating: 5 },
  { name: 'Marcus T.', role: 'Swing Trader', avatar: '📈', content: 'The Pro Trader persona gives structured trade setups with clear entry/SL/TP that rival paid signal groups. Price alerts saved me multiple times.', rating: 5 },
  { name: 'Sarah K.', role: 'DeFi Researcher', avatar: '🔬', content: 'The Degen Advisor persona tracks narratives I wouldn\'t find for weeks. Caught the AI token narrative early. Risk transparency is refreshing.', rating: 5 },
  { name: 'James L.', role: 'Portfolio Manager', avatar: '💼', content: 'Portfolio analytics with live P&L tracking, performance charts, and CSV export — everything I need. Dashboard gives me a full market overview at a glance.', rating: 5 },
  { name: 'Nina W.', role: 'Technical Analyst', avatar: '📊', content: 'RSI, MACD, Bollinger Bands, EMA — all the indicators I need right on the chart. The depth chart for order book visualization is a killer feature.', rating: 5 },
];

const faqs = [
  { q: 'Is TradeZen free to use?', a: 'Yes! TradeZen is completely free and open source. All features — AI Mentor with 4 personas, 50+ coin tracking, pro charts, portfolio analytics, and price alerts — are included at no cost.' },
  { q: 'Does TradeZen execute trades for me?', a: 'No. TradeZen is an educational and analytics platform. We provide market data, AI mentoring, portfolio tracking, and alerts — but we don\'t connect to exchanges for trading execution.' },
  { q: 'How accurate is the AI mentor?', a: 'Our AI mentor is powered by Llama 3.3 70B via Groq with 4 specialized personas. It provides educational guidance based on established trading principles and live market data, but no AI can predict the market with certainty.' },
  { q: 'Where does the market data come from?', a: 'All price data streams directly from Binance via WebSocket for real-time updates across 50 crypto pairs. Chart data from Binance REST API. Global market stats from CoinGecko.' },
  { q: 'Can I use TradeZen on mobile?', a: 'Yes! TradeZen is a fully responsive web app that works beautifully on any device — desktop, tablet, or mobile.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use Supabase for authentication and data storage with Row Level Security (RLS), ensuring your data is private, encrypted, and only accessible by you.' },
  { q: 'What AI personas are available?', a: 'Four specialized personas: 📊 Market Analyst (technical/fundamental analysis), 🎓 Crypto Teacher (educational content), 💰 Pro Trader (actionable trade signals), and 🔥 Degen Advisor (high-risk alpha & narratives).' },
];

const comparisonFeatures = [
  { feature: 'Real-time Price Data', tradezen: true, free: 'Limited' as string | boolean, paid: true as string | boolean },
  { feature: 'AI Trading Mentor', tradezen: true, free: false, paid: 'Basic' },
  { feature: '4 AI Personas', tradezen: true, free: false, paid: false },
  { feature: 'Pro Chart Indicators', tradezen: true, free: 'Limited', paid: true },
  { feature: 'Order Book Depth Chart', tradezen: true, free: false, paid: true },
  { feature: 'Portfolio Analytics', tradezen: true, free: 'Basic', paid: true },
  { feature: 'Performance Chart', tradezen: true, free: false, paid: true },
  { feature: 'Smart Price Alerts', tradezen: true, free: 'Limited', paid: true },
  { feature: 'CSV Export', tradezen: true, free: false, paid: true },
  { feature: 'Portfolio-Aware AI', tradezen: true, free: false, paid: false },
  { feature: 'Price', tradezen: 'Free' as string | boolean, free: 'Free', paid: '$20-50/mo' },
];

const chatDemo = [
  { role: 'user' as const, text: 'Analyze BTC for me right now' },
  { role: 'ai' as const, text: '📊 **Bitcoin Analysis — Market Analyst Mode**\n\n**Current Trend:** Bullish ✅ (Confidence: 4/5)\n\n| Metric | Value |\n|--------|-------|\n| Price | $97,245 |\n| 24h Change | +2.4% |\n| RSI (14) | 62 — Not overbought |\n| MACD | Bullish crossover on 4H |\n\n**Key Levels:**\n- 🟢 Support: $95,200 / $92,800\n- 🔴 Resistance: $98,500 / $100K\n\n**Trade Setup:**\nEntry: $96,800–$97,200 | TP1: $99K | SL: $95K\nR:R → 1:1.15\n\n⚠️ *Educational analysis, not financial advice.*' },
];

const techStack = [
  { name: 'Next.js 16', desc: 'React Framework' },
  { name: 'TypeScript', desc: 'Type Safety' },
  { name: 'Tailwind v4', desc: 'Utility CSS' },
  { name: 'Supabase', desc: 'Auth & Database' },
  { name: 'Binance WS', desc: 'Real-time Data' },
  { name: 'Groq AI', desc: 'Llama 3.3 70B' },
  { name: 'TradingView', desc: 'Chart Library' },
  { name: 'Framer Motion', desc: 'Animations' },
];

// ───── Animated stat component ─────
function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useCounter(value, 2000, isInView);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-[#00FF88] font-[family-name:var(--font-space-grotesk)]">
        {count}{suffix}
      </p>
      <p className="text-xs text-[#8888AA] mt-1">{label}</p>
    </div>
  );
}

// ───── Feature card with expandable details ─────
function FeatureCard({ feature, i }: { feature: typeof features[0]; i: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      whileHover={{ y: -6 }}
      onClick={() => setExpanded(!expanded)}
      className="p-6 rounded-xl border border-white/5 bg-[#12121A] hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(300px at 80% 20%, ${feature.color}08, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${feature.color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: feature.color }} />
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
          >
            {feature.stats}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
          {feature.title}
        </h3>
        <p className="text-sm text-[#8888AA] leading-relaxed">{feature.description}</p>
        <AnimatePresence>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-1.5 overflow-hidden"
            >
              {feature.details.map((d) => (
                <li key={d} className="flex items-center gap-2 text-xs text-[#aaa]">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: feature.color }} />
                  {d}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#0A0A0F]" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
              TradeZen
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'AI Mentor', 'Comparison', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-[#8888AA] hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#8888AA] hover:text-white">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C5CE7]/3 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5 mb-6">
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
              <span className="text-sm text-[#00FF88]">AI-Powered Trading Intelligence — 100% Free & Open Source</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-[family-name:var(--font-space-grotesk)] leading-tight">
              Master Crypto Trading
              <br />
              <span className="bg-gradient-to-r from-[#00FF88] via-[#00D4FF] to-[#6C5CE7] bg-clip-text text-transparent">
                With AI Guidance
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#8888AA] max-w-2xl mx-auto mb-8">
              50 live crypto pairs, 4 AI mentor personas, pro chart indicators, portfolio analytics, and smart alerts — everything a serious trader needs, in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <button className="get-started-btn">
                  <span className="get-started-btn-text">Start Trading Smarter</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-[1]" />
                </button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg">
                  <Play className="w-4 h-4 mr-2" /> View Live Demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[#666]">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Supabase Secured</span>
              <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Real-time WebSocket</span>
              <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> Open Source</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-2xl mx-auto">
            <AnimatedStat value={50} suffix="+" label="Live Coins" />
            <AnimatedStat value={4} suffix="" label="AI Personas" />
            <AnimatedStat value={5} suffix="+" label="Chart Indicators" />
            <AnimatedStat value={100} suffix="%" label="Free Forever" />
          </motion.div>
        </div>
      </section>

      {/* ─── Live Ticker ─── */}
      <section className="py-4"><PriceTicker /></section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5 mb-4">
              <Rocket className="w-4 h-4 text-[#00FF88]" />
              <span className="text-sm text-[#00FF88]">Pro-Level Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent"> Trade Smarter</span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">Professional-grade tools powered by AI. Click any card to explore details.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Personas Showcase ─── */}
      <section id="ai-mentor" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D4FF]/[0.02] to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5 mb-4">
              <Brain className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">4 Specialized AI Personas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Your Personal<span className="bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent"> Crypto Brain Trust</span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">Switch between AI experts depending on what you need — each one speaks a different language.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {proFeatures.map((pf, i) => (
              <motion.div key={pf.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} whileHover={{ y: -8, scale: 1.02 }}
                className="p-6 rounded-xl border border-white/5 bg-[#12121A] hover:border-white/15 transition-all group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${pf.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className="relative">
                  <div className="text-3xl mb-3">{pf.icon}</div>
                  <h3 className="text-base font-semibold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">{pf.title}</h3>
                  <p className="text-sm text-[#8888AA] leading-relaxed">{pf.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Chat Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6">
                AI That Actually<span className="bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent"> Understands Markets</span>
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: Activity, text: 'Reads live market data in real-time from your dashboard' },
                  { icon: Wallet, text: 'Analyzes your portfolio when context mode is on' },
                  { icon: BarChart3, text: 'Provides structured trade setups with entry/TP/SL' },
                  { icon: GraduationCap, text: 'Teaches from blockchain basics to advanced trading' },
                  { icon: Flame, text: 'Tracks narratives and finds early alpha opportunities' },
                  { icon: Clock, text: 'Available 24/7 with markdown-rich instant responses' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00FF88]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-[#00FF88]" />
                    </div>
                    <span className="text-sm text-[#ccc] leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl shadow-[#00D4FF]/5"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#0A0A0F]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">TradeZen AI Mentor</p>
                    <p className="text-[10px] text-[#00FF88]">● Market Analyst Mode • Llama 3.3 70B</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['📊', '🎓', '💰', '🔥'].map((e) => (
                    <div key={e} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs">{e}</div>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-4 max-h-[420px] overflow-hidden">
                {chatDemo.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-1">
                        <Brain className="w-3.5 h-3.5 text-[#0A0A0F]" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'bg-[#00FF88]/10 text-white border border-[#00FF88]/20' : 'bg-white/5 text-white/90 border border-white/5'
                    }`}>
                      <div className="whitespace-pre-wrap text-xs">{msg.text}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-2 p-4 border-t border-white/5">
                <div className="flex-1 h-9 rounded-md bg-[#0A0A0F] border border-white/10 px-3 flex items-center">
                  <span className="text-sm text-[#555]">Ask your crypto mentor...</span>
                </div>
                <div className="h-9 w-9 rounded-md bg-[#00FF88] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#0A0A0F]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF88]/[0.02] to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5 mb-4">
              <Layers className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Up and Running in<span className="bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent"> 4 Easy Steps</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} whileHover={{ y: -4 }}
                  className="relative p-6 rounded-xl border border-white/5 bg-[#12121A] text-center group hover:border-white/10 transition-all"
                >
                  <div className="text-5xl font-black text-white/[0.03] absolute top-3 right-4 font-[family-name:var(--font-space-grotesk)]">{step.num}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${step.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">{step.title}</h3>
                  <p className="text-sm text-[#8888AA] leading-relaxed">{step.description}</p>
                  {i < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gradient-to-r from-white/10 to-transparent" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Dashboard Preview ─── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              A Dashboard Built for<span className="bg-gradient-to-r from-[#FFD93D] to-[#FF6B6B] bg-clip-text text-transparent"> Serious Traders</span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">Real-time prices, interactive charts, Fear & Greed index, gainers/losers, portfolio summary, and news — all at a glance.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-white/10 bg-[#12121A] overflow-hidden shadow-2xl shadow-[#00FF88]/5"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A0A0F]">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="ml-3 flex-1 h-6 rounded bg-white/5 flex items-center px-3">
                <Lock className="w-3 h-3 text-[#00FF88] mr-1.5" />
                <span className="text-[10px] text-[#8888AA]">tradezen.app/dashboard</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Market Cap', value: '$3.42T', color: '#00D4FF' },
                  { label: '24h Volume', value: '$142.5B', color: '#00FF88' },
                  { label: 'BTC Dom', value: '54.2%', color: '#F7931A' },
                  { label: 'ETH Dom', value: '17.3%', color: '#627EEA' },
                  { label: 'Active Coins', value: '14,230', color: '#FFD93D' },
                ].map((s) => (
                  <div key={s.label} className="p-2.5 rounded-lg bg-[#0A0A0F] border border-white/5">
                    <p className="text-[9px] text-[#8888AA]">{s.label}</p>
                    <p className="text-xs font-bold font-[family-name:var(--font-space-grotesk)]" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Bitcoin', icon: '₿', price: '$97,245', change: '+2.41%', positive: true },
                  { name: 'Ethereum', icon: 'Ξ', price: '$3,842', change: '+1.87%', positive: true },
                  { name: 'Solana', icon: '◎', price: '$198.42', change: '-0.93%', positive: false },
                  { name: 'BNB', icon: '◆', price: '$612.30', change: '+3.12%', positive: true },
                ].map((c) => (
                  <div key={c.name} className="p-3 rounded-lg bg-[#0A0A0F] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{c.icon}</span>
                      <span className="text-[10px] text-[#8888AA]">{c.name}</span>
                    </div>
                    <p className="text-sm font-bold text-white font-[family-name:var(--font-space-grotesk)]">{c.price}</p>
                    <p className={`text-[10px] mt-0.5 ${c.positive ? 'text-[#00FF88]' : 'text-red-400'}`}>{c.change}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 h-44 rounded-lg bg-[#0A0A0F] border border-white/5 p-3 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[#8888AA]">BTC/USDT • 1H • RSI • MACD</p>
                    <div className="flex gap-1">
                      {['1m', '5m', '1H', '4H', '1D'].map((tf) => (
                        <span key={tf} className={`text-[8px] px-1.5 py-0.5 rounded ${tf === '1H' ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'text-[#555]'}`}>{tf}</span>
                      ))}
                    </div>
                  </div>
                  <svg viewBox="0 0 400 100" className="w-full h-full opacity-60">
                    <defs>
                      <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FF88" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,70 Q20,65 40,68 T80,55 T120,60 T160,45 T200,50 T240,35 T280,40 T320,25 T360,30 L400,20 L400,100 L0,100 Z" fill="url(#heroChartGrad)" />
                    <path d="M0,70 Q20,65 40,68 T80,55 T120,60 T160,45 T200,50 T240,35 T280,40 T320,25 T360,30 L400,20" fill="none" stroke="#00FF88" strokeWidth="1.5" />
                    <path d="M0,60 Q40,50 80,45 T160,35 T240,25 T320,18 L400,12" fill="none" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,2" />
                    <path d="M0,80 Q40,75 80,70 T160,60 T240,50 T320,40 L400,35" fill="none" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,2" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#0A0A0F] border border-white/5">
                    <p className="text-[9px] text-[#8888AA]">Fear & Greed</p>
                    <p className="text-lg font-bold text-[#00FF88] font-[family-name:var(--font-space-grotesk)]">72</p>
                    <div className="h-1 rounded-full bg-[#1a1a24] mt-1">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#00FF88]" />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0A0A0F] border border-white/5">
                    <p className="text-[9px] text-[#8888AA]">Top Gainer</p>
                    <p className="text-xs font-bold text-[#00FF88]">DOGE +12.4%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0A0A0F] border border-white/5">
                    <p className="text-[9px] text-[#8888AA]">Portfolio</p>
                    <p className="text-xs font-bold text-white">$24,850</p>
                    <p className="text-[9px] text-[#00FF88]">+$1,230 (5.2%)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#12121A] to-transparent" />
          </motion.div>

          <div className="flex items-center justify-center gap-6 mt-6">
            {[{ icon: Monitor, label: 'Desktop' }, { icon: Smartphone, label: 'Mobile' }].map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-xs text-[#666]">
                <d.icon className="w-4 h-4" /><span>{d.label} Optimized</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section id="comparison" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6C5CE7]/[0.02] to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              TradeZen vs<span className="bg-gradient-to-r from-[#6C5CE7] to-[#00D4FF] bg-clip-text text-transparent"> The Competition</span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">See how we stack up against other free tools and paid platforms.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#8888AA]">Feature</th>
                    <th className="text-center px-5 py-3.5"><span className="text-xs font-bold text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full">TradeZen</span></th>
                    <th className="text-center px-5 py-3.5 text-xs font-medium text-[#8888AA]">Free Tools</th>
                    <th className="text-center px-5 py-3.5 text-xs font-medium text-[#8888AA]">Paid Platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-white/[0.03] ${i === comparisonFeatures.length - 1 ? 'bg-white/[0.02]' : ''}`}>
                      <td className="px-5 py-3 text-sm text-white">{row.feature}</td>
                      <td className="px-5 py-3 text-center">
                        {row.tradezen === true ? <Check className="w-5 h-5 text-[#00FF88] mx-auto" /> : <span className="text-sm font-bold text-[#00FF88]">{String(row.tradezen)}</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.free === true ? <Check className="w-4 h-4 text-[#8888AA] mx-auto" /> : row.free === false ? <X className="w-4 h-4 text-red-400/50 mx-auto" /> : <span className="text-xs text-yellow-400/70">{String(row.free)}</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.paid === true ? <Check className="w-4 h-4 text-[#8888AA] mx-auto" /> : row.paid === false ? <X className="w-4 h-4 text-red-400/50 mx-auto" /> : <span className="text-xs text-[#8888AA]">{String(row.paid)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Loved by<span className="bg-gradient-to-r from-[#FFD93D] to-[#FD79A8] bg-clip-text text-transparent"> Traders Worldwide</span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">See what our community of traders and learners are saying.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="p-6 rounded-xl border border-white/5 bg-[#12121A] hover:border-white/10 transition-all relative"
              >
                <Quote className="w-8 h-8 text-[#00FF88]/10 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-[#8888AA]">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-[#FFD93D] fill-[#FFD93D]" />
                  ))}
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed">{t.content}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-6 p-6 rounded-xl border border-white/5 bg-[#12121A] relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div key={testimonialIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{testimonials[testimonialIdx].avatar}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-white">{testimonials[testimonialIdx].name}</span>
                    <span className="text-xs text-[#8888AA]">{testimonials[testimonialIdx].role}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonials[testimonialIdx].rating }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 text-[#FFD93D] fill-[#FFD93D]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#ccc] leading-relaxed">{testimonials[testimonialIdx].content}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-[#00FF88] w-5' : 'bg-white/10'}`} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="py-14 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-[#8888AA] mb-8 uppercase tracking-widest">Built with industry-leading technology</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {techStack.map((tech) => (
              <motion.div key={tech.name} whileHover={{ y: -3 }} className="text-center p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all">
                <p className="text-xs font-semibold text-white font-[family-name:var(--font-space-grotesk)]">{tech.name}</p>
                <p className="text-[10px] text-[#666] mt-0.5">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Frequently Asked<span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent"> Questions</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden"
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#8888AA] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#00FF88]' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-[#8888AA] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center p-12 rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121A] to-[#0A0A0F] relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00FF88]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#00D4FF]/8 rounded-full blur-3xl" />
          <div className="relative">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Ready to Start Your<span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent"> Trading Journey?</span>
            </h2>
            <p className="text-[#8888AA] mb-8 max-w-md mx-auto">
              Join TradeZen today — 50 live coins, 4 AI personas, pro charts, portfolio analytics, and smart alerts. All free, forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <button className="get-started-btn">
                  <span className="get-started-btn-text">Create Free Account</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-[1]" />
                </button>
              </Link>
              <a href="https://github.com/saxdy7/TradeZen" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg">
                  <Github className="w-4 h-4 mr-2" /> Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#0A0A0F]" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">TradeZen</span>
              </div>
              <p className="text-xs text-[#8888AA] leading-relaxed mb-3">AI-powered crypto trading mentor & analytics platform. Learn, track, and trade smarter.</p>
              <div className="flex gap-2">
                <a href="https://github.com/saxdy7/TradeZen" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors"><Github className="w-4 h-4 text-[#8888AA]" /></a>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors cursor-pointer"><Twitter className="w-4 h-4 text-[#8888AA]" /></div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors cursor-pointer"><Globe className="w-4 h-4 text-[#8888AA]" /></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                {['Dashboard', 'Market Data', 'AI Mentor', 'Portfolio', 'Price Alerts', 'Charts'].map((item) => (
                  <li key={item}><span className="text-xs text-[#8888AA] hover:text-[#00FF88] transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">AI Personas</h4>
              <ul className="space-y-2">
                {['📊 Market Analyst', '🎓 Crypto Teacher', '💰 Pro Trader', '🔥 Degen Advisor'].map((item) => (
                  <li key={item}><span className="text-xs text-[#8888AA] hover:text-[#00FF88] transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2">
                {['Trading Guide', 'Crypto Glossary', 'API Documentation', 'Changelog', 'Open Source'].map((item) => (
                  <li key={item}><span className="text-xs text-[#8888AA] hover:text-[#00FF88] transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#8888AA]">© 2026 TradeZen. All rights reserved.</p>
            <p className="text-[10px] text-[#555]">Not financial advice. Crypto trading involves significant risk. Trade responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
