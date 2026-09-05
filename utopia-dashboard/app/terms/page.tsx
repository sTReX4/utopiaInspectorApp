'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center text-xs font-mono font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-none">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gateway
          </Link>
        </div>

        {/* Document Container */}
        <div className="bg-white border border-slate-200 rounded-none p-8 md:p-16 shadow-sm">
          
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-10 h-10 object-contain mr-3" />
              <span className="text-xl font-bold tracking-widest uppercase">Utopia Security</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Terms of Service</h1>
          </div>

          {/* Document Body */}
          <div className="space-y-8 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">1. System Access & Authorization</h2>
              <p>
                Access to the Utopia Security Command Center and the Utopia Inspector Application is strictly restricted to actively employed, officially provisioned personnel. By authenticating your session, you confirm that you are an authorized user acting on behalf of the Utopia Security Group of Companies. Unauthorized access, attempts to breach the cryptographic security roles, or distribution of access credentials will result in immediate termination and potential legal prosecution.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">2. Operational Usage & Data Integrity</h2>
              <p className="mb-3">
                Personnel utilizing the digital tracking and reporting system agree to submit accurate, unaltered operational data. You are strictly prohibited from:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Spoofing, altering, or masking physical GPS coordinate transmissions during detachment verifications.</li>
                <li>Uploading falsified or non-live photographic evidence to bypass guard attendance requirements.</li>
                <li>Falsifying digital signatures belonging to guards on duty or client representatives.</li>
              </ul>
              <p className="mt-3">
                Any deliberate manipulation of inspection reports constitutes a severe breach of operational protocol.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">3. Hardware & Device Provisioning</h2>
              <p>
                Inspectors using field devices acknowledge that access keys are securely generated and bound to their specific digital identity. The Command Center logs all hardware interactions, session timeouts, and data extractions. Personnel are responsible for securing their provisioned devices to prevent unauthorized detachment deployments or report submissions.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">4. Incident Reporting & Escalation</h2>
              <p>
                The system utilizes an Automated QC/TBD Escalation Engine. By logging violations, uniform non-compliance, or missing documents, you authorize the system to automatically format and transmit these records to executive management and external client Command Centers (e.g., UnionBank). You are responsible for ensuring the factual accuracy of all incident triggers.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">5. Termination of Access</h2>
              <p>
                Utopia Security reserves the right to terminate, suspend, or throttle system access for any user account at any time, without prior notice, upon detection of suspicious activity, contract termination, or violation of these Terms of Service.
              </p>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}