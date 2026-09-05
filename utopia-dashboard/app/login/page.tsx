'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle, Loader2, MapPin, Phone, Mail as MailIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    // BREAKOUT WRAPPER: fixed inset-0 z-50 ignores the layout's ml-64 margin completely
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-y-auto w-full h-full">
      
      {/* TOP NAVIGATION HEADER */}
      <header className="bg-[#0f172a] h-16 flex items-center px-6 shrink-0 border-b border-slate-800">
        <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-8 h-8 object-contain mr-3" />
        <span className="text-xl font-bold text-white tracking-widest uppercase">Utopia</span>
      </header>

      {/* MAIN LOGIN SECTION - flex-1 perfectly fills space between header and footer without overflowing */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">

        {/* Login Card */}
        <div className="max-w-md w-full bg-white shadow-sm border border-slate-200 overflow-hidden rounded-none mb-12">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start rounded-none">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium font-mono uppercase tracking-widest">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Official Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-none text-slate-900 font-mono text-sm bg-slate-50 focus:bg-white rounded-none"
                    placeholder="admin@utopiasecurity.com.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-none text-slate-900 font-mono text-sm bg-slate-50 focus:bg-white rounded-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 font-bold flex items-center justify-center transition-none shadow-sm rounded-none tracking-widest text-sm uppercase ${
                  isLoading ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate System'}
              </button>

              {/* MANDATORY LEGAL MICRO-COPY */}
              <div className="border-t border-slate-200 mt-6 pt-6">
                <p className="text-[10px] text-slate-500 text-center leading-relaxed font-mono uppercase tracking-widest">
                  By authenticating, you acknowledge and agree to the <a href="/terms" className="text-blue-600 hover:text-blue-800 font-bold underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-bold underline">Privacy Policy</a> in accordance with the Data Privacy Act of 2012.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* DARK ENTERPRISE FOOTER */}
      <footer className="bg-[#0f172a] text-slate-300 py-12 border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-6 h-6 object-contain" />
              <span className="text-lg font-bold text-white tracking-widest uppercase">Utopia Security</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 pr-4 font-mono uppercase tracking-widest">
              Embodying professional confidence and reliable competence. Your 24/7 partner in asset protection and loss prevention since 2011.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Official Channels</h3>
            <ul className="space-y-3 text-xs font-mono text-slate-400 uppercase tracking-widest">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">4F PADAVELA Bldg 2011 G. Tuazon cor Samar Sts, Sampaloc, Manila</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>287427256</span>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <span>humanresource@utopiasecurity.com.ph</span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Legal & Compliance</h3>
            <ul className="space-y-3 text-xs font-mono text-slate-400 uppercase tracking-widest">
              <li><a href="/terms" className="hover:text-white transition-none flex items-center gap-2"><span className="w-1 h-1 bg-slate-500 rounded-none"></span> Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-white transition-none flex items-center gap-2"><span className="w-1 h-1 bg-slate-500 rounded-none"></span> Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Copyright © {new Date().getFullYear()} Utopia Security Group of Companies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}