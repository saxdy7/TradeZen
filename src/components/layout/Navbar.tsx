'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || '');
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-16 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-4 pl-14 lg:pl-6 lg:px-6">
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="h-2 w-2 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-xs lg:text-sm text-[#8888AA]">Live Market Data</span>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Clickable user pill → goes to /profile */}
        <Link href="/profile">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/5 transition-all cursor-pointer group">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-[#0A0A0F]" />
            </div>
            <span className="text-sm text-white/80 max-w-[150px] truncate group-hover:text-white transition-colors">
              {email || 'Loading...'}
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg text-sm text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
