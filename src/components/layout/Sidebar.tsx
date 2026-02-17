'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Wallet,
  Bell,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/market', label: 'Market', icon: TrendingUp },
  { href: '/mentor', label: 'AI Mentor', icon: MessageSquare },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#0A0A0F] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#0A0A0F]" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent font-[family-name:var(--font-heading)]">
          TradeZen
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-[#00FF88] bg-[#00FF88]/10'
                    : 'text-[#8888AA] hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#00FF88]"
                  />
                )}
                <Icon className="w-5 h-5" />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="text-xs text-[#8888AA] text-center">
          TradeZen v1.0 • Powered by AI
        </div>
      </div>
    </aside>
  );
}
