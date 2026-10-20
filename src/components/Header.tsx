// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, ChevronDown, Loader2, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getSimulatedUser, setSimulatedUser } from '@/lib/auth-mode';

interface HeaderProps {
  currentView: 'dashboard' | 'graph' | 'settings';
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

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthErrorReason(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // If data.url returned, browser will redirect; if not, open diagnostic modal
      if (!data?.url) {
        throw new Error('Supabase did not return an OAuth authorization URL.');
      }
    } catch (err: any) {
      console.warn('OAuth initiation failed:', err);
      setAuthErrorReason(
        err?.message || 'Supabase instance is currently offline/paused or has unresolved DNS.'
      );
      setShowAuthModal(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSimulateCleanUser = () => {
    setSimulatedUser({
      id: `usr_${Date.now()}`,
      email: 'alex.chen@omnibrain.dev',
      name: 'Alex Chen',
      isSimulated: true,
    });
    setShowAuthModal(false);
    setIsDropdownOpen(false);
  };

  const handleSwitchToDemoGuest = () => {
    setSimulatedUser(null);
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
    setUser(null);
    setShowAuthModal(false);
    setIsDropdownOpen(false);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const userEmail = user?.email || '';
  const userInitial = (userEmail[0] || 'U').toUpperCase();
  const isCleanUser = user && !user.isGuest;

  return (
    <>
      <header className="h-14 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-white text-black font-bold text-xs flex items-center justify-center rounded shadow-sm">
              ▲
            </div>
            <span className="font-semibold text-sm tracking-tight text-white hover:text-indigo-400 transition-colors">
              OmniBrain
            </span>
          </Link>

          {/* Mode Pill Badge */}
          {user ? (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Clean User Mode
            </span>
          ) : (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Demo Guest Mode
            </span>
          )}
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentView === 'dashboard'
                ? 'bg-[#1f1f23] text-white border border-[#27272a]'
                : 'text-zinc-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/graph"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentView === 'graph'
                ? 'bg-[#1f1f23] text-white border border-[#27272a]'
                : 'text-zinc-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            Constellation Graph
          </Link>
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#18181b] transition-colors border border-[#27272a]"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {userInitial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#121215] border border-[#27272a] rounded-lg shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#1c1c21]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.user_metadata?.full_name || 'Authenticated User'}
                      </p>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                        Clean Slate
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">{userEmail}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      No mock data shown. Ingest notes to build your private graph.
                    </p>
                  </div>

                  <button
                    onClick={handleSwitchToDemoGuest}
                    className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-[#1c1c21] flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Switch to Demo Guest Data</span>
                  </button>

                  <button
                    onClick={handleSwitchToDemoGuest}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-[#1c1c21] flex items-center gap-2 transition-colors border-t border-[#1c1c21]"
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
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 font-medium px-3.5 py-1.5 rounded-md text-xs transition-all shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Diagnostic & Test Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#2b2b36] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Google OAuth Diagnostic Notice</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  The configured Supabase instance is currently unreachable or paused on the free tier.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0b0e] border border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="text-zinc-500 uppercase tracking-wider text-[10px]">Error Details:</div>
              <div className="text-rose-400 break-all">{authErrorReason}</div>
              <div className="text-zinc-500 pt-1 border-t border-zinc-800">
                Target: <span className="text-zinc-300">yykkvekbfiispfjwpggx.supabase.co</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              To test the application right now without re-configuring cloud DNS:
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleSimulateCleanUser}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/20"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                  <div className="text-left">
                    <div className="font-semibold">Simulate Authenticated Clean User</div>
                    <div className="text-[10px] text-indigo-200">Starts completely fresh (0 mock data)</div>
                  </div>
                </div>
                <span className="font-mono text-[10px]">Active User ➔</span>
              </button>

              <button
                onClick={handleSwitchToDemoGuest}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#181820] hover:bg-[#20202a] border border-[#2b2b36] text-zinc-300 font-medium text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="font-semibold">Continue as Demo Guest</div>
                    <div className="text-[10px] text-zinc-500">Explore pre-populated markdown & graph clusters</div>
                  </div>
                </div>
                <span className="font-mono text-[10px]">Guest ➔</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
