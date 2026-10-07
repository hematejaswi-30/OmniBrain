// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'graph' | 'settings';
}

export default function Header({ currentView }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsDropdownOpen(false);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const userEmail = user?.email || '';
  const userInitial = (userEmail[0] || 'U').toUpperCase();

  return (
    <header className="h-14 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-white text-black font-bold text-xs flex items-center justify-center rounded">▲</div>
        <span className="font-semibold text-sm tracking-tight text-white">OmniBrain</span>
        <span className="font-mono text-[10px] text-zinc-500 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded">
          ant.graphify.com
        </span>
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
      <div className="relative">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-[#18181b] transition-colors border border-[#27272a]"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                  {userInitial}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#121215] border border-[#27272a] rounded-md shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-[#1c1c21]">
                  <p className="text-xs font-medium text-white truncate">{user.user_metadata?.full_name || 'Authenticated User'}</p>
                  <p className="text-[11px] font-mono text-zinc-400 truncate">{userEmail}</p>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-[#1c1c21] flex items-center gap-2 transition-colors mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center gap-2 bg-white text-black hover:opacity-90 font-medium px-3.5 py-1.5 rounded-md text-xs transition-opacity"
          >
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
          </button>
        )}
      </div>
    </header>
  );
}
