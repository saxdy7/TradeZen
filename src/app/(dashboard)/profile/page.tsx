'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAlerts } from '@/hooks/useAlerts';
import {
    User, Mail, Shield, Bell, Wallet, MessageSquare, Edit3, Check, X,
    LogOut, Camera, TrendingUp, Calendar, Copy, CheckCheck, Key, Sparkles,
    ChevronRight, Globe, Lock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COIN_ICONS } from '@/lib/binance';

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
}

const AVATAR_COLORS = [
    'from-[#00FF88] to-[#00D4FF]',
    'from-[#6C5CE7] to-[#FD79A8]',
    'from-[#FFD93D] to-[#F7931A]',
    'from-[#00D4FF] to-[#6C5CE7]',
    'from-[#FD79A8] to-[#FF6B6B]',
];

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const { holdings } = usePortfolio();
    const { alerts } = useAlerts();

    const [user, setUser] = useState<{ id: string; email: string; created_at: string } | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [copied, setCopied] = useState(false);
    const [avatarColor, setAvatarColor] = useState(0);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // Load user + profile
    useEffect(() => {
        const load = async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (!u) { router.push('/login'); return; }
            setUser({ id: u.id, email: u.email || '', created_at: u.created_at });

            // stable avatar color from user id
            const code = u.id.charCodeAt(0) + u.id.charCodeAt(1);
            setAvatarColor(code % AVATAR_COLORS.length);

            const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
            if (data) {
                setProfile(data);
                setNewUsername(data.username || '');
            } else {
                setNewUsername(u.email?.split('@')[0] || '');
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveUsername = async () => {
        if (!newUsername.trim()) return;
        setUsernameLoading(true);
        setUsernameError('');
        try {
            if (profile) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ username: newUsername.trim() })
                    .eq('id', user!.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('profiles')
                    .insert({ id: user!.id, username: newUsername.trim() });
                if (error) throw error;
            }
            setProfile((p) => ({ ...(p ?? { id: user!.id }), username: newUsername.trim() }));
            setEditingUsername(false);
        } catch (err: unknown) {
            setUsernameError(err instanceof Error ? err.message : 'Failed to update username');
        } finally {
            setUsernameLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setPasswordLoading(true);
        setPasswordMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        await supabase.auth.signOut();
        router.push('/login');
    };

    const copyUserId = async () => {
        if (!user) return;
        await navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';

    const displayName = profile?.username || user?.email?.split('@')[0] || 'Trader';
    const initials = displayName.slice(0, 2).toUpperCase();

    // Portfolio total invested
    const totalInvested = holdings.reduce((s, h) => s + h.buy_price * h.amount, 0);

    const statsCards = [
        { icon: Wallet, label: 'Holdings', value: `${holdings.length} coins`, color: '#FFD93D', href: '/portfolio' },
        { icon: TrendingUp, label: 'Invested', value: `$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#00FF88', href: '/portfolio' },
        { icon: Bell, label: 'Active Alerts', value: `${alerts.filter(a => !a.is_triggered).length}`, color: '#6C5CE7', href: '/alerts' },

        { icon: MessageSquare, label: 'AI Mentor', value: 'Chat', color: '#00D4FF', href: '/mentor' },
    ];

    return (
        <div className="space-y-5 max-w-4xl mx-auto">

            {/* ─── Header ─── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#0A0A0F]" />
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">My Profile</h1>
                    <p className="text-xs text-[#8888AA]">Manage your account, preferences and security</p>
                </div>
            </div>

            {/* ─── Profile Card ─── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/5 bg-[#12121A] p-6"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[avatarColor]} flex items-center justify-center text-[#0A0A0F] font-bold text-2xl font-[family-name:var(--font-space-grotesk)] shadow-lg`}>
                            {initials}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#12121A] border border-white/10 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-[#00FF88]" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Username row */}
                        <div className="flex items-center gap-2 mb-1">
                            {editingUsername ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="h-8 text-sm bg-[#0A0A0F] border-white/10 text-white max-w-[200px]"
                                        placeholder="Username"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={usernameLoading}
                                        className="p-1.5 rounded-lg bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setEditingUsername(false); setUsernameError(''); }}
                                        className="p-1.5 rounded-lg bg-white/5 text-[#8888AA] hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">{displayName}</h2>
                                    <button
                                        onClick={() => { setEditingUsername(true); setNewUsername(profile?.username || displayName); }}
                                        className="p-1 rounded text-[#8888AA] hover:text-[#00FF88] transition-colors"
                                        title="Edit username"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                        {usernameError && <p className="text-xs text-red-400 mb-1">{usernameError}</p>}

                        {/* Email */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <Mail className="w-3.5 h-3.5 text-[#8888AA]" />
                            <span className="text-sm text-[#8888AA]">{user?.email || '—'}</span>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[10px] text-[#00FF88]">
                                <Shield className="w-3 h-3" />
                                Verified Trader
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[10px] text-[#00D4FF]">
                                <Sparkles className="w-3 h-3" />
                                AI Mentor Access
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#8888AA]">
                                <Calendar className="w-3 h-3" />
                                Joined {joinedDate}
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        {logoutLoading ? 'Logging out...' : 'Logout'}
                    </button>
                </div>

                {/* User ID */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-[#555] mb-0.5">User ID</p>
                        <p className="text-xs font-mono text-[#8888AA] truncate max-w-[280px]">{user?.id || '—'}</p>
                    </div>
                    <button
                        onClick={copyUserId}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8888AA] hover:text-white transition-colors text-[10px]"
                    >
                        {copied
                            ? <><CheckCheck className="w-3 h-3 text-[#00FF88]" /> Copied!</>
                            : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                </div>
            </motion.div>

            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statsCards.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link href={s.href}>
                            <div className="rounded-xl border border-white/5 bg-[#12121A] p-4 hover:border-white/10 transition-all group cursor-pointer">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}15` }}>
                                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                </div>
                                <p className="text-[10px] text-[#8888AA]">{s.label}</p>
                                <p className="text-base font-bold text-white font-[family-name:var(--font-space-grotesk)]">{s.value}</p>
                                <ChevronRight className="w-3 h-3 text-[#333] group-hover:text-[#8888AA] transition-colors mt-1" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* ─── Holdings Preview ─── */}
            {holdings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-white/5 bg-[#12121A] p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-[#FFD93D]" />
                            <h3 className="text-sm font-medium text-white">Your Holdings</h3>
                        </div>
                        <Link href="/portfolio" className="text-[10px] text-[#00FF88] hover:underline flex items-center gap-1">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {holdings.slice(0, 8).map((h) => (
                            <div key={h.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0A0A0F] border border-white/5">
                                <span className="text-base">{COIN_ICONS[`${h.coin_symbol.toLowerCase()}usdt`] || '●'}</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{h.coin_symbol}</p>
                                    <p className="text-[10px] text-[#8888AA]">{h.amount} units</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ─── Two-column: Account Details | Security ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Account Details */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-2xl border border-white/5 bg-[#12121A] p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#00D4FF]" />
                        <h3 className="text-sm font-medium text-white">Account Details</h3>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: 'Display Name', value: displayName },
                            { label: 'Email Address', value: user?.email || '—' },
                            { label: 'Member Since', value: joinedDate },
                            { label: 'Account Type', value: 'Free Plan' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                <span className="text-xs text-[#8888AA]">{label}</span>
                                <span className="text-xs text-white font-medium">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Edit username shortcut */}
                    <button
                        onClick={() => setEditingUsername(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-xs text-[#8888AA] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-all"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Display Name
                    </button>
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-white/5 bg-[#12121A] p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#6C5CE7]" />
                        <h3 className="text-sm font-medium text-white">Change Password</h3>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-3">
                        <div>
                            <label className="text-[10px] text-[#8888AA] mb-1.5 block">New Password</label>
                            <Input
                                type="password"
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-[#0A0A0F] border-white/10 text-white text-sm placeholder:text-[#444]"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-[#8888AA] mb-1.5 block">Confirm New Password</label>
                            <Input
                                type="password"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-[#0A0A0F] border-white/10 text-white text-sm placeholder:text-[#444]"
                                required
                            />
                        </div>

                        {passwordMsg && (
                            <p className={`text-xs px-3 py-2 rounded-lg ${passwordMsg.type === 'success'
                                ? 'bg-[#00FF88]/10 text-[#00FF88]'
                                : 'bg-red-500/10 text-red-400'
                                }`}>
                                {passwordMsg.text}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white font-medium"
                        >
                            {passwordLoading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Key className="w-4 h-4 mr-2" />Update Password</>
                            )}
                        </Button>
                    </form>
                </motion.div>
            </div>

            {/* ─── Quick Links ─── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-white/5 bg-[#12121A] p-5"
            >
                <h3 className="text-sm font-medium text-white mb-3">Quick Navigation</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { label: 'Dashboard', href: '/dashboard', color: '#00FF88', desc: 'Market overview' },
                        { label: 'AI Mentor', href: '/mentor', color: '#00D4FF', desc: 'Chat with AI' },
                        { label: 'Portfolio', href: '/portfolio', color: '#FFD93D', desc: 'Manage holdings' },
                        { label: 'Alerts', href: '/alerts', color: '#6C5CE7', desc: 'Price targets' },
                    ].map((link) => (
                        <Link key={link.label} href={link.href}>
                            <div className="rounded-xl border border-white/5 hover:border-white/10 bg-[#0A0A0F] p-3 transition-all group cursor-pointer">
                                <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: link.color }} />
                                <p className="text-xs font-medium text-white">{link.label}</p>
                                <p className="text-[10px] text-[#666]">{link.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
