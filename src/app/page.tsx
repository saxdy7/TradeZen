'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MessageSquare,
  Wallet,
  Eye,
  Target,
  Layers,
  Github,
  Twitter,
  Globe,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriceTicker from '@/components/crypto/PriceTicker';

const features = [
  {
    icon: TrendingUp,
    title: 'Live Market Data',
    description: 'Real-time prices from Binance WebSocket for instant market awareness.',
    color: '#00FF88',
  },
  {
    icon: Brain,
    title: 'AI Trading Mentor',
    description: 'Get expert guidance powered by Llama 3.3 70B AI on trading strategies.',
    color: '#00D4FF',
  },
  {
    icon: BarChart3,
    title: 'Professional Charts',
    description: 'TradingView-powered candlestick charts with volume analysis.',
    color: '#FFD93D',
  },
  {
    icon: Shield,
    title: 'Portfolio Tracker',
    description: 'Track your holdings with real-time P&L and distribution analytics.',
    color: '#FF6B6B',
  },
  {
    icon: Bell,
    title: 'Price Alerts',
    description: 'Set custom price alerts and get notified when targets are hit.',
    color: '#6C5CE7',
  },
  {
    icon: Sparkles,
    title: 'Risk Management',
    description: 'Learn position sizing, stop losses, and professional risk control.',
    color: '#FD79A8',
  },
];

const steps = [
  {
    num: '01',
    icon: Eye,
    title: 'Sign Up Free',
    description: 'Create your account in seconds. No credit card, no hidden fees.',
  },
  {
    num: '02',
    icon: BarChart3,
    title: 'Explore Markets',
    description: 'Browse 20+ live crypto pairs with real-time charts and data.',
  },
  {
    num: '03',
    icon: MessageSquare,
    title: 'Ask the AI Mentor',
    description: 'Get personalized trading guidance, analysis, and strategy tips.',
  },
  {
    num: '04',
    icon: Target,
    title: 'Track & Alert',
    description: 'Build your portfolio, set price alerts, and trade with confidence.',
  },
];

const testimonials = [
  {
    name: 'Alex R.',
    role: 'Day Trader',
    avatar: '🧑‍💻',
    content: 'TradeZen\'s AI mentor helped me understand candlestick patterns in a way no YouTube video ever could. The real-time data is incredibly fast.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    role: 'Crypto Beginner',
    avatar: '👩‍🎓',
    content: 'I was overwhelmed by crypto before TradeZen. The AI breaks down complex concepts into simple, actionable advice. Love the portfolio tracker too!',
    rating: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Swing Trader',
    avatar: '📈',
    content: 'The price alerts saved me multiple times. I set targets before bed and wake up to notifications. The chart quality rivals paid platforms.',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Is TradeZen free to use?',
    a: 'Yes! TradeZen is completely free. We believe everyone should have access to professional-grade trading tools and AI-powered education.',
  },
  {
    q: 'Does TradeZen execute trades for me?',
    a: 'No. TradeZen is an educational and analytics platform. We provide market data, AI mentoring, portfolio tracking, and alerts — but we don\'t connect to exchanges for trading.',
  },
  {
    q: 'How accurate is the AI mentor?',
    a: 'Our AI mentor is powered by Llama 3.3 70B, one of the most capable open-source models. It provides educational guidance based on established trading principles, but remember — no AI can predict the market with certainty.',
  },
  {
    q: 'Where does the market data come from?',
    a: 'All price data streams directly from Binance via WebSocket for real-time updates. Candlestick chart data is also sourced from Binance\'s REST API.',
  },
  {
    q: 'Can I use TradeZen on mobile?',
    a: 'TradeZen is a responsive web app that works on any device with a browser. A dedicated mobile app is on our roadmap for the future.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use Supabase for authentication and data storage with Row Level Security, ensuring your data is private and only accessible by you.',
  },
];

const chatDemo = [
  { role: 'user' as const, text: 'Should I buy Bitcoin right now?' },
  { role: 'ai' as const, text: 'Great question! Let me break this down for you. Currently, you should consider:\n\n📊 **Technical Analysis**: Check if BTC is near a support level on the daily chart.\n\n⚠️ **Risk Management**: Never invest more than you can afford to lose. Consider dollar-cost averaging (DCA) instead of going all-in.\n\n📈 **Market Sentiment**: Check the Fear & Greed index on your dashboard for current market mood.\n\nRemember: I provide educational guidance, not financial advice!' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Navigation */}
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
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#8888AA] hover:text-white">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5 mb-6">
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
              <span className="text-sm text-[#00FF88]">AI-Powered Trading Intelligence</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-[family-name:var(--font-space-grotesk)] leading-tight">
              Master Crypto Trading
              <br />
              <span className="bg-gradient-to-r from-[#00FF88] via-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
                With AI Guidance
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#8888AA] max-w-2xl mx-auto mb-8">
              Real-time market data, professional charts, AI mentor, and portfolio tracking —
              everything you need to trade smarter, all in one platform.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <button className="get-started-btn">
                  <span className="get-started-btn-text">Get Started</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-[1]" />
                </button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto"
          >
            {[
              { value: '20+', label: 'Live Coins' },
              { value: '24/7', label: 'AI Mentor' },
              { value: 'Free', label: 'Real-time Data' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-[#00FF88] font-[family-name:var(--font-space-grotesk)]">
                  {stat.value}
                </p>
                <p className="text-xs text-[#8888AA] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Ticker */}
      <section className="py-4">
        <PriceTicker />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
                {' '}Trade Smarter
              </span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">
              Professional-grade tools powered by AI, designed for both beginners and experienced traders.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-xl border border-white/5 bg-[#12121A] hover:border-white/10 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#8888AA] leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF88]/[0.02] to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5 mb-4">
              <Layers className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Up and Running in
              <span className="bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
                {' '}4 Easy Steps
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative p-6 rounded-xl border border-white/5 bg-[#12121A] text-center group hover:border-[#00FF88]/20 transition-all"
                >
                  <div className="text-5xl font-black text-white/[0.03] absolute top-3 right-4 font-[family-name:var(--font-space-grotesk)]">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FF88]/10 to-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4 group-hover:from-[#00FF88]/20 group-hover:to-[#00D4FF]/20 transition-all">
                    <Icon className="w-6 h-6 text-[#00FF88]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#8888AA] leading-relaxed">{step.description}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gradient-to-r from-[#00FF88]/30 to-transparent" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              A Dashboard Built for
              <span className="bg-gradient-to-r from-[#FFD93D] to-[#FF6B6B] bg-clip-text text-transparent">
                {' '}Serious Traders
              </span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">
              Everything at a glance — live prices, interactive charts, market sentiment, and your portfolio.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-white/10 bg-[#12121A] overflow-hidden shadow-2xl shadow-[#00FF88]/5"
          >
            {/* Mock dashboard top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A0A0F]">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-[#8888AA]">tradezen.app/dashboard</span>
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {/* Price cards mock */}
              {['Bitcoin ₿', 'Ethereum Ξ', 'Solana ◎', 'BNB ◆'].map((coin, i) => (
                <div key={coin} className="p-4 rounded-xl bg-[#0A0A0F] border border-white/5">
                  <p className="text-xs text-[#8888AA] mb-1">{coin}</p>
                  <p className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    ${(Math.random() * 60000 + 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className={`text-xs mt-1 ${i % 2 === 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                    {i % 2 === 0 ? '+' : '-'}{(Math.random() * 5 + 0.5).toFixed(2)}%
                  </p>
                </div>
              ))}
              {/* Chart mock */}
              <div className="col-span-3 h-48 rounded-xl bg-[#0A0A0F] border border-white/5 p-4 relative overflow-hidden">
                <p className="text-xs text-[#8888AA] mb-2">BTC/USDT • 1h</p>
                <svg viewBox="0 0 400 120" className="w-full h-full opacity-60">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF88" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 Q30,70 60,75 T120,60 T180,65 T240,40 T300,50 T360,30 L400,25 L400,120 L0,120 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0,80 Q30,70 60,75 T120,60 T180,65 T240,40 T300,50 T360,30 L400,25"
                    fill="none"
                    stroke="#00FF88"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              {/* Side stats mock */}
              <div className="col-span-1 space-y-3">
                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-white/5">
                  <p className="text-xs text-[#8888AA]">Fear & Greed</p>
                  <p className="text-xl font-bold text-[#00FF88] font-[family-name:var(--font-space-grotesk)]">72</p>
                  <div className="h-1.5 rounded-full bg-[#1a1a24] mt-1">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#00FF88]" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-white/5">
                  <p className="text-xs text-[#8888AA]">Top Gainer</p>
                  <p className="text-sm font-bold text-[#00FF88]">SOL +8.42%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-white/5">
                  <p className="text-xs text-[#8888AA]">Portfolio</p>
                  <p className="text-sm font-bold text-white">$12,450</p>
                </div>
              </div>
            </div>
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#12121A] to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* AI Mentor Showcase */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D4FF]/[0.02] to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5 mb-4">
                <Brain className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-sm text-[#00D4FF]">AI-Powered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                Your Personal
                <span className="bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
                  {' '}Crypto Mentor
                </span>
              </h2>
              <p className="text-[#8888AA] mb-6 leading-relaxed">
                Powered by Llama 3.3 70B, our AI mentor understands market analysis, trading psychology,
                technical indicators, and risk management. Ask anything — from beginner questions to advanced strategies.
              </p>
              <ul className="space-y-3">
                {[
                  'Explains candlestick patterns & chart reading',
                  'Teaches risk management & position sizing',
                  'Breaks down DeFi, NFTs, and Layer 2 concepts',
                  'Personalized advice based on your questions',
                  'Available 24/7 with instant responses',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#00FF88] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#ccc]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — chat demo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl shadow-[#00D4FF]/5"
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0A0A0F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">TradeZen AI Mentor</p>
                  <p className="text-[10px] text-[#00FF88]">● Online</p>
                </div>
              </div>
              {/* Chat messages */}
              <div className="p-4 space-y-4 max-h-[380px] overflow-hidden">
                {chatDemo.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-1">
                        <Brain className="w-3.5 h-3.5 text-[#0A0A0F]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#00FF88]/10 text-white border border-[#00FF88]/20'
                          : 'bg-white/5 text-white/90 border border-white/5'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Fake input */}
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

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Loved by
              <span className="bg-gradient-to-r from-[#FFD93D] to-[#FD79A8] bg-clip-text text-transparent">
                {' '}Traders Worldwide
              </span>
            </h2>
            <p className="text-[#8888AA] max-w-lg mx-auto">
              See what our community says about their TradeZen experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-xl border border-white/5 bg-[#12121A] hover:border-white/10 transition-all relative"
              >
                <Quote className="w-8 h-8 text-[#00FF88]/10 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-[#8888AA]">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-[#FFD93D] text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed">{t.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack / Trust Bar */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-[#8888AA] mb-6 uppercase tracking-widest">Built with industry-leading technology</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Binance API', 'TradingView', 'Groq AI'].map((tech) => (
              <span key={tech} className="text-sm text-[#8888AA] font-medium font-[family-name:var(--font-space-grotesk)]">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Frequently Asked
              <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
                {' '}Questions
              </span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8888AA] flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180 text-[#00FF88]' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-[#8888AA] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center p-12 rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121A] to-[#0A0A0F] relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00FF88]/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
              Ready to Start Your
              <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
                {' '}Trading Journey?
              </span>
            </h2>
            <p className="text-[#8888AA] mb-8">
              Join TradeZen today and get access to AI-powered insights, real-time data, and professional tools — completely free.
            </p>
            <Link href="/signup">
              <button className="get-started-btn">
                <span className="get-started-btn-text">Create Free Account</span>
                <ArrowRight className="w-5 h-5 ml-2 relative z-[1]" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#0A0A0F]" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
                  TradeZen
                </span>
              </div>
              <p className="text-xs text-[#8888AA] leading-relaxed">
                AI-powered crypto trading mentor & analytics platform. Learn, track, and trade smarter.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                {['Dashboard', 'Market Data', 'AI Mentor', 'Portfolio', 'Price Alerts'].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-[#8888AA] hover:text-[#00FF88] transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2">
                {['Trading Guide', 'Crypto Glossary', 'API Documentation', 'Changelog'].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-[#8888AA] hover:text-[#00FF88] transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Connect</h4>
              <div className="flex gap-3 mb-4">
                <a href="https://github.com/saxdy7/TradeZen" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors">
                  <Github className="w-4 h-4 text-[#8888AA]" />
                </a>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors cursor-pointer">
                  <Twitter className="w-4 h-4 text-[#8888AA]" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00FF88]/10 transition-colors cursor-pointer">
                  <Globe className="w-4 h-4 text-[#8888AA]" />
                </div>
              </div>
              <p className="text-xs text-[#8888AA]">
                Open source on GitHub
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#8888AA]">© 2026 TradeZen. All rights reserved.</p>
            <p className="text-[10px] text-[#555]">
              Not financial advice. Crypto trading involves significant risk. Trade responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
