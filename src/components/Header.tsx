// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, ChevronDown, Loader2, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, X, ArrowRight, Plus } from 'lucide-react';
import { getSimulatedUser, setSimulatedUser } from '@/lib/auth-mode';

interface HeaderProps {
  currentView: 'dashboard' | 'explorer' | 'settings';
}

export default function Header({ currentView }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);

  const supabase = createClient();

  const syncAuth = () => {
    // 1. Check local simulated user
    const sim = getSimulatedUser();
    if (sim) {
      setUser({
        id: sim.id,
        email: sim.email,
        user_metadata: { full_name: sim.name, avatar_url: sim.avatar_url },
        isSimulated: true,
      });
      return;
    }

    // 2. Check Supabase user
    try {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }).catch(() => {
        setUser(null);
      });
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    syncAuth();

    const handleAuthChange = () => syncAuth();
    window.addEventListener('omnibrain_auth_change', handleAuthChange);

    // Listen for real Supabase auth changes
    let subscription: any = null;
    try {
      const subRes = supabase.auth.onAuthStateChange((_event, session) => {
        if (!getSimulatedUser()) {
          setUser(session?.user || null);
        }
      });
      subscription = subRes.data?.subscription;
    } catch {}

    return () => {
      window.removeEventListener('omnibrain_auth_change', handleAuthChange);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');

  const GOOGLE_ACCOUNTS = [
    {
      name: 'Hema Tejaswi',
      email: 'hematejaswi29@gmail.com',
      initial: 'H',
      tag: 'Primary Google Account',
      badgeClass: 'bg-[#2F4A3A] text-[#FAF7F2] dark:bg-[#B08D57] dark:text-[#1C1C1C]',
    },
    {
      name: 'Alex Chen',
      email: 'alex.chen@omnibrain.dev',
      initial: 'A',
      tag: 'Developer Workspace',
      badgeClass: 'bg-[#4A453E] text-[#FAF7F2] dark:bg-[#5C574F] dark:text-[#EDE8DF]',
    },
  ];

  const handleSelectAccount = (acc: { name: string; email: string }) => {
    setSelectedAccountEmail(acc.email);
    setIsAuthenticating(true);

    setTimeout(() => {
      setSimulatedUser({
        id: `google_${Date.now()}`,
        email: acc.email,
        name: acc.name,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`,
        isSimulated: true,
      });

      setIsAuthenticating(false);
      setSelectedAccountEmail(null);
      setShowAuthModal(false);
      setShowAddAccount(false);
      setIsDropdownOpen(false);
    }, 550);
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newAccountName.trim() || 'Custom User';
    const rawEmail = newAccountEmail.trim() || 'developer@gmail.com';
    const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;

    handleSelectAccount({ name, email });
  };

  const handleSwitchToDemoGuest = () => {
    setSimulatedUser(null);
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
    setUser(null);
    setShowAuthModal(false);
    setShowAddAccount(false);
    setIsDropdownOpen(false);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || user?.name || userEmail.split('@')[0] || 'User';
  const userInitial = (userName[0] || userEmail[0] || 'U').toUpperCase();
  const isCleanUser = user && !user.isGuest;

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    } catch {}

    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    window.addEventListener('omnibrain_theme_change', handleThemeChange);
    return () => window.removeEventListener('omnibrain_theme_change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const isCurrentDark = document.documentElement.classList.contains('dark');
    const next = isCurrentDark ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('omnibrain_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new Event('omnibrain_theme_change'));
    } catch {}
  };

  return (
    <>
      <header className="h-14 w-full border-b border-[#E8E2D8] dark:border-[#31302D] bg-[#FAF7F2]/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#2F4A3A] dark:bg-[#B08D57] text-[#FAF7F2] dark:text-[#1C1C1C] font-serif font-bold text-xs flex items-center justify-center rounded">
              Ω
            </div>
            <span className="font-serif font-semibold text-base tracking-tight text-[#2B2B2B] dark:text-[#EDE8DF] hover:opacity-80 transition-opacity">
              OmniBrain
            </span>
          </Link>

          {/* Mode Pill Badge */}
          {user ? (
            <span className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] bg-[#EBF1EC] dark:bg-[#2B261D] border border-[#D5DFD7] dark:border-[#3E372B] px-2 py-0.5 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
              Private Workspace
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#F2EDE5] dark:bg-[#252422] border border-[#E1D9CC] dark:border-[#383632] px-2 py-0.5 rounded flex items-center gap-1">
              Guest Demo
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              currentView === 'dashboard'
                ? 'bg-[#EFEAE2] dark:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] border border-[#DCD4C7] dark:border-[#383632]'
                : 'text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF]'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/explorer"
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              currentView === 'explorer'
                ? 'bg-[#EFEAE2] dark:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] border border-[#DCD4C7] dark:border-[#383632]'
                : 'text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF]'
            }`}
          >
            Explorer
          </Link>
        </nav>

        {/* Right Controls: Theme Toggle & Auth */}
        <div className="flex items-center gap-2.5">
          {/* Classy Theme Segmented Switcher */}
          <div 
            onClick={toggleTheme}
            className="flex items-center p-0.5 rounded-full border border-[#DDD5C7] dark:border-[#383632] bg-[#EFEAE2] dark:bg-[#252422] cursor-pointer select-none transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } }}
            title={theme === 'dark' ? 'Dark Luxury Active (Click for Editorial Light)' : 'Editorial Light Active (Click for Dark Luxury)'}
            aria-label="Toggle between Editorial Light and Dark Luxury themes"
          >
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all duration-150 ${
              theme === 'light'
                ? 'bg-[#FAF7F2] text-[#2B2B2B] shadow-xs font-semibold'
                : 'text-[#8A847A] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF]'
            }`}>
              <span>☀️</span>
              <span className="hidden sm:inline">Light</span>
            </span>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-[#1C1C1C] text-[#EDE8DF] shadow-xs font-semibold'
                : 'text-[#8A847A] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF]'
            }`}>
              <span>🌙</span>
              <span className="hidden sm:inline">Dark</span>
            </span>
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded hover:bg-[#F2EDE5] dark:hover:bg-[#252422] transition-colors border border-[#E1D9CC] dark:border-[#383632]"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-[#2F4A3A] dark:bg-[#B08D57] flex items-center justify-center text-xs font-bold text-[#FAF7F2] dark:text-[#1C1C1C]">
                    {userInitial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#6B655C] dark:text-[#9E9990] mr-1" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F2] dark:bg-[#20201F] border border-[#E1D9CC] dark:border-[#383632] rounded shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E8E2D8] dark:border-[#31302D]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] truncate">
                        {user.user_metadata?.full_name || 'Authenticated User'}
                      </p>
                      <span className="text-[9px] font-mono text-[#2F4A3A] dark:text-[#B08D57] bg-[#EBF1EC] dark:bg-[#2B261D] border border-[#D5DFD7] dark:border-[#3E372B] px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990] truncate">{userEmail}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#6B655C] dark:text-[#9E9990] hover:bg-[#F2EDE5] dark:hover:bg-[#282725] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Switch Google Account...</span>
                  </button>

                  <button
                    onClick={handleSwitchToDemoGuest}
                    className="w-full text-left px-4 py-2 text-xs text-[#6B655C] dark:text-[#9E9990] hover:bg-[#F2EDE5] dark:hover:bg-[#282725] flex items-center gap-2 transition-colors"
                  >
                    <span>Switch to Demo Guest Data</span>
                  </button>

                  <button
                    onClick={handleSwitchToDemoGuest}
                    className="w-full text-left px-4 py-2 text-xs text-[#8A4A4A] dark:text-[#C47D7D] hover:bg-[#F2EDE5] dark:hover:bg-[#282725] flex items-center gap-2 transition-colors border-t border-[#E8E2D8] dark:border-[#31302D]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthErrorReason(null);
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-medium px-3 py-1.5 rounded text-xs transition-colors cursor-pointer shadow-none"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Google Account Chooser Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] dark:bg-[#20201F] border border-[#DDD5C7] dark:border-[#383632] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200 text-[#2B2B2B] dark:text-[#EDE8DF]">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-[#1A1A19] border border-[#E1D9CC] dark:border-[#383632] flex items-center justify-center shadow-xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold tracking-tight text-[#2B2B2B] dark:text-[#EDE8DF]">
                    Choose an account
                  </h3>
                  <p className="text-xs text-[#6B655C] dark:text-[#9E9990] font-sans">
                    to continue to OmniBrain Workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setShowAddAccount(false);
                }}
                className="text-[#8A847A] hover:text-[#2B2B2B] dark:hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Available Google Accounts */}
            <div className="space-y-2">
              {GOOGLE_ACCOUNTS.map((acc) => {
                const isSelected = selectedAccountEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isAuthenticating}
                    className="w-full p-3 rounded-lg border border-[#DDD5C7] dark:border-[#383632] bg-[#FFFFFF] dark:bg-[#1A1A19] hover:bg-[#F3EFE8] dark:hover:bg-[#282725] hover:border-[#2F4A3A] dark:hover:border-[#B08D57] flex items-center justify-between transition-all cursor-pointer group text-left disabled:opacity-60 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${acc.badgeClass} flex items-center justify-center font-bold text-xs shrink-0 font-serif`}>
                        {acc.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] flex items-center gap-1.5 truncate">
                          <span>{acc.name}</span>
                          <span className="text-[9px] font-mono text-[#8A847A] font-normal truncate hidden sm:inline">
                            • {acc.tag}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990] truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isAuthenticating && isSelected ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2F4A3A] dark:text-[#B08D57]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden sm:inline">Signing in...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8A847A] group-hover:text-[#2F4A3A] dark:group-hover:text-[#B08D57] transition-colors">
                          ➔
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Use Another Account Button */}
              <button
                onClick={() => setShowAddAccount(!showAddAccount)}
                disabled={isAuthenticating}
                className="w-full p-2.5 rounded-lg border border-dashed border-[#DDD5C7] dark:border-[#383632] hover:border-[#2F4A3A] dark:hover:border-[#B08D57] bg-[#FAF7F2]/50 dark:bg-[#1C1C1C]/50 hover:bg-[#F4EFE7] dark:hover:bg-[#242422] text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-white text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="font-medium">Use another Google account</span>
              </button>
            </div>

            {/* Custom Google Account Entry Form (Revealed when clicked) */}
            {showAddAccount && (
              <form onSubmit={handleAddNewAccount} className="space-y-3 p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#1A1A19] border border-[#DDD5C7] dark:border-[#383632] animate-in fade-in duration-150">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] font-semibold">
                  Sign in with Custom Google Account
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="e.g. Hema Tejaswi"
                      className="w-full bg-[#FAF7F2] dark:bg-[#20201F] border border-[#DDD5C7] dark:border-[#383632] focus:border-[#2F4A3A] dark:focus:border-[#B08D57] rounded px-2.5 py-1.5 text-xs text-[#2B2B2B] dark:text-[#EDE8DF] outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] mb-1">
                      Google Email
                    </label>
                    <input
                      type="email"
                      value={newAccountEmail}
                      onChange={(e) => setNewAccountEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full bg-[#FAF7F2] dark:bg-[#20201F] border border-[#DDD5C7] dark:border-[#383632] focus:border-[#2F4A3A] dark:focus:border-[#B08D57] rounded px-2.5 py-1.5 text-xs text-[#2B2B2B] dark:text-[#EDE8DF] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className="px-2.5 py-1 text-xs text-[#8A847A] hover:text-[#2B2B2B] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-medium py-1.5 px-3.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-none"
                  >
                    <span>Sign In ➔</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Guest Switch Option */}
            <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#31302D] flex items-center justify-between text-xs">
              <button
                onClick={handleSwitchToDemoGuest}
                className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990] hover:text-[#2F4A3A] dark:hover:text-[#B08D57] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#2F4A3A] dark:text-[#B08D57]" />
                <span>Continue as Demo Guest (Browse 3 Sample Clusters)</span>
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setShowAddAccount(false);
                }}
                className="text-[11px] text-[#8A847A] hover:text-[#2B2B2B] dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
