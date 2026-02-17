'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0A0A0F]" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
            TradeZen
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#12121A] p-8">
          <h1 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
            Welcome Back
          </h1>
          <p className="text-sm text-[#8888AA] mb-6">
            Sign in to access your trading dashboard
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#8888AA] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#0A0A0F] border-white/10 text-white placeholder:text-[#555]"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#8888AA] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#0A0A0F] border-white/10 text-white placeholder:text-[#555]"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-semibold py-5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0A0A0F]/20 border-t-[#0A0A0F] rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-sm text-[#8888AA] text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#00FF88] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
