'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Envelope, Warning, CircleNotch, MapPin, Phone, Eye, EyeSlash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  /*
   * Defaults to hidden. The input must render as type="password" on first
   * paint, both because that is the safe default over the shoulder and
   * because the end-to-end suite selects the field by input[type="password"].
   */
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/');

    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 bg-sunken focus:bg-surface border border-line rounded-control ' +
    'text-ink text-sm outline-none transition-colors duration-200 ' +
    'focus:border-info-ink placeholder:text-ink-muted';

  return (
    <div className="flex flex-col min-h-[100dvh]">

      <header className="bg-shell h-16 flex items-center px-6 shrink-0">
        <img src="/images/utopia_logo.png" alt="Utopia" className="w-8 h-8 object-contain mr-3" />
        <span className="text-lg font-serif text-shell-ink">Utopia</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">

        <div className="max-w-md w-full bg-surface border border-line rounded-card p-8 mb-12">
          <div className="mb-8">
            <h1 className="text-2xl font-serif text-ink mb-1">Sign in</h1>
            <p className="text-sm text-ink-muted">
              Operations access for authorised Utopia personnel.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 p-4 bg-danger-bg border border-danger-ink/15 rounded-control flex items-start gap-3"
            >
              <Warning weight="fill" className="w-5 h-5 text-danger-ink shrink-0 mt-0.5" />
              <p className="text-sm text-danger-ink">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Official email
              </label>
              <div className="relative">
                <Envelope
                  weight="bold"
                  className="w-5 h-5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                  placeholder="you@utopiasecurity.com.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <Lock
                  weight="bold"
                  className="w-5 h-5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  /* pr-11 keeps the value clear of the reveal control. */
                  className={`${inputClass} pr-11`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/*
                  * type="button" is load bearing. Without it this control
                  * inherits submit behaviour and posts the form on click.
                  */}
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-control text-ink-muted hover:text-ink transition-colors duration-200"
                >
                  {showPassword
                    ? <EyeSlash weight="bold" className="w-5 h-5" />
                    : <Eye weight="bold" className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-control font-medium text-sm flex items-center justify-center gap-2 press transition-colors duration-200 ${
                isLoading
                  ? 'bg-ink-muted cursor-not-allowed text-surface'
                  : 'bg-ink hover:bg-shell-hover text-surface'
              }`}
            >
              {isLoading && <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Authenticating' : 'Authenticate System'}
            </button>

            <div className="border-t border-line pt-5">
              <p className="text-xs text-ink-muted text-center leading-relaxed">
                By authenticating, you acknowledge and agree to the{' '}
                <a href="/terms" className="text-info-ink underline underline-offset-2 hover:no-underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-info-ink underline underline-offset-2 hover:no-underline">Privacy Policy</a>
                {' '}in accordance with the Data Privacy Act of 2012.
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer className="bg-shell text-shell-muted py-12 shrink-0">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/images/utopia_logo.png" alt="Utopia" className="w-6 h-6 object-contain" />
              <span className="text-base font-serif text-shell-ink">Utopia Security</span>
            </div>
            <p className="text-sm leading-relaxed pr-4">
              Your 24/7 partner in asset protection and loss prevention since 2011.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-shell-ink mb-4">Official channels</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin weight="bold" className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  4F PADAVELA Bldg 2011 G. Tuazon cor Samar Sts, Sampaloc, Manila
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone weight="bold" className="w-4 h-4 shrink-0" />
                <span className="font-mono">287427256</span>
              </li>
              <li className="flex items-center gap-3">
                <Envelope weight="bold" className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs">humanresource@utopiasecurity.com.ph</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-medium text-shell-ink mb-4">Legal and compliance</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="/terms" className="hover:text-shell-ink transition-colors duration-200">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-shell-ink transition-colors duration-200">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 mt-10 pt-6 border-t border-shell-line">
          <p className="text-xs">
            Copyright {new Date().getFullYear()} Utopia Security Group of Companies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
