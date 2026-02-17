'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-sm text-[#8888AA]">Live Market Data</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
          <User className="w-4 h-4 text-[#8888AA]" />
          <span className="text-sm text-white/80">{email || 'Loading...'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
