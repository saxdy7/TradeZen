'use client';

import { motion } from 'framer-motion';
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
    description: 'Get expert guidance powered by Llama 3 70B AI on trading strategies.',
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

export default function LandingPage() {
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
                <Button size="lg" className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-semibold px-8 py-6 text-lg">
                  Start Trading
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
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
              <Button size="lg" className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-semibold px-10 py-6 text-lg">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00FF88]" />
            <span className="text-sm text-[#8888AA]">TradeZen © 2026</span>
          </div>
          <p className="text-xs text-[#8888AA]">
            Not financial advice. Trade responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
