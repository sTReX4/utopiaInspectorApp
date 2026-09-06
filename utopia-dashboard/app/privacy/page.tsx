'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-10- h-10 object-contain mr-3" />
              <span className="text-xl font-bold tracking-widest uppercase">Utopia Security</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Privacy Policy</h1>
          </div>

          {/* Document Body */}
          <div className="space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="bg-slate-100 p-4 border border-slate-200">
              <p className="font-mono text-xs uppercase tracking-widest font-bold text-slate-900">Statutory Compliance Notice</p>
              <p className="mt-2 text-slate-700">
                This Privacy Policy is executed in strict compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Republic of the Philippines. It outlines the collection, processing, retention, and sharing of personal and operational data within the Utopia Security digital infrastructure.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">1. Data Collection Matrix</h2>
              <p className="mb-3">To enforce operational compliance, our systems (Mobile App & Command Center) collect the following specific data categories:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Geospatial Data:</strong> Real-time background GPS coordinates (Latitude/Longitude) during detachment QR verification and audit submission.</li>
                <li><strong>Photographic Evidence:</strong> Live, timestamped media captures of personnel on duty for anti-spoofing verification.</li>
                <li><strong>Biometric/E-Signatures:</strong> Digital signatures of field guards and client representatives captured directly on device touchscreens.</li>
                <li><strong>Professional Credentials:</strong> License to Exercise Security Profession (LESP) numbers, expiry dates, and firearm serial numbers.</li>
                <li><strong>Authentication Metadata:</strong> IP addresses, timestamps, and active session tokens managed by Supabase Auth.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">2. Purpose of Processing</h2>
              <p>
                Data is strictly processed to execute legitimate business operations. GPS and photographic data verify physical deployment to client detachments. E-Signatures and checklist violations are extracted into automated CSVs for Internal Accounting/Payroll processing, and compiled into standardized PDF Incident Reports for external Client Operations (e.g., banking command centers).
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">3. Data Retention & Archiving</h2>
              <p>
                In accordance with agency retention policies configured via the Command Center settings, routine audit logs, media payloads, and generated reports are retained for a default period of <strong>12 months</strong>. Records exceeding this global system threshold are targeted for automated soft-deletion to maintain optimal database performance, unless subject to active legal or operational holds.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">4. Information Sharing & Disclosure</h2>
              <p>
                Utopia Security does not sell personnel data. Incident data (including guard names, photos, and compliance status) is securely shared <em>only</em> with the specific external client hosting the detachment (e.g., UnionBank) as proof of operational delivery. Raw data dumps are strictly restricted to internal Human Resources and Accounting departments.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3 font-mono">5. Personnel Rights</h2>
              <p>
                Under the Data Privacy Act of 2012, personnel have the right to be informed, the right to object, the right to access, the right to rectify erroneous data, and the right to erasure or blocking. Requests to exercise these rights regarding your digital profile must be directed to your Operations Manager or the Human Resource Department.
              </p>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
}