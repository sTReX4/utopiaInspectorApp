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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-y-auto w-full h-full transition-none">
      
      {/* TOP NAVIGATION HEADER */}
      <header className="bg-[#0f172a] h-16 flex items-center px-6 shrink-0 border-b border-slate-800">
        <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-10 h-10 object-contain mr-3" />
        <span className="text-xl font-bold tracking-widest text-slate-100 uppercase">Utopia</span>
      </header>

      {/* MAIN LOGIN SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">

        {/* Sterile Login Card */}
        <div className="max-w-md w-full bg-white border border-slate-300 rounded-none overflow-hidden mb-12">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 border border-red-300 bg-red-50 flex items-start">
                <AlertCircle className="w-4 h-4 text-red-600 mr-3 mt-0.5 shrink-0" />
                <p className="text-xs font-mono font-bold text-red-800 uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white transition-none"
                    placeholder="admin@utopiasecurity.com.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white transition-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-none mt-4 ${
                  isLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate System'}
              </button>

              {/* MANDATORY LEGAL MICRO-COPY */}
              <p className="text-[10px] font-mono text-slate-500 text-center leading-relaxed mt-6 px-2 uppercase tracking-widest">
                By logging in, you acknowledge the <a href="#" className="text-slate-900 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-slate-900 font-bold hover:underline">Privacy Policy</a> per DPA 2012.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* DARK ENTERPRISE FOOTER */}
      <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-6 h-6 object-contain" />
              <span className="text-sm font-bold text-slate-100 tracking-widest uppercase">Utopia</span>
            </div>
            <p className="text-xs font-mono tracking-widest leading-relaxed text-slate-500 pr-4 uppercase">
              Professional confidence. Reliable competence. Asset protection & loss prevention since 2011.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-5 border-b border-slate-700 pb-2 inline-block">Contact Data</h3>
            <ul className="space-y-4 text-xs font-mono uppercase tracking-widest text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="leading-relaxed">4F PADAVELA Bldg 2011 G. Tuazon cor Samar Sts, Sampaloc, Manila</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                <span>287427256</span>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="truncate">humanresource@utopiasecurity.com.ph</span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-5 border-b border-slate-700 pb-2 inline-block">Legal Directives</h3>
            <ul className="space-y-3 text-xs font-mono uppercase tracking-widest text-slate-500">
              <li><a href="#" className="hover:text-slate-200 transition-none flex items-center gap-2"><span className="text-slate-600 font-bold">{'>'}</span> Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-none flex items-center gap-2"><span className="text-slate-600 font-bold">{'>'}</span> Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-none flex items-center gap-2"><span className="text-slate-600 font-bold">{'>'}</span> Data Privacy Notice</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-none flex items-center gap-2"><span className="text-slate-600 font-bold">{'>'}</span> Access Agreement</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
            Copyright © {new Date().getFullYear()} Utopia Security Group. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}