import Link from 'next/link';
import Image from 'next/image';
import ParticleBackground from '@/components/ui/particle-background';
import TypewriterText from '@/components/ui/typewriter-text';
import FadeIn from '@/components/ui/fade-in';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/image.png" alt="SRM Logo" width={32} height={32} className="object-contain" />
            <div className="font-semibold tracking-tight text-lg">
              SRM
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/verify" 
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1"
            >
              Verify Document
            </Link>
            <Link 
              href="/login" 
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
          <ParticleBackground />
          <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center pointer-events-none">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] text-zinc-900 mb-8 min-h-[140px] md:min-h-[160px]">
              <TypewriterText 
                text={"Digital Approval &\nVerification Platform"} 
                delay={70}
                initialDelay={800}
              />
            </h1>
            <FadeIn delay={2500}>
              <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-12 leading-relaxed">
                The authoritative system for securely processing, verifying, and storing institutional documents. Built with enterprise-grade cryptography to ensure absolute data integrity.
              </p>
            </FadeIn>
            <FadeIn delay={2800}>
              <div className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
                <Link 
                  href="/login" 
                  className="h-12 px-8 inline-flex items-center justify-center bg-zinc-900 text-white font-medium rounded-[4px] hover:bg-zinc-800 transition-colors shadow-sm w-full sm:w-auto"
                >
                  Access Portal
                </Link>
                <Link 
                  href="/verify" 
                  className="h-12 px-8 inline-flex items-center justify-center bg-white text-zinc-900 font-medium rounded-[4px] hover:bg-zinc-50 border border-zinc-200 transition-colors shadow-sm w-full sm:w-auto"
                >
                  Verify Document
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Security Architecture Section */}
        <section className="py-24 bg-zinc-50 border-t border-zinc-100 px-6">
          <div className="mx-auto max-w-7xl">
            <FadeIn delay={0}>
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
                  Architecture of Trust
                </h2>
                <p className="text-zinc-500 text-lg leading-relaxed">
                  We employ defense-in-depth security practices. Every document, approval, and system interaction is cryptographically verified and permanently logged to prevent unauthorized tampering.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
              {/* Feature 1 */}
              <FadeIn delay={100}>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-3">Envelope Encryption</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    Documents are never stored in plaintext. We utilize unique AES-256-GCM Data Encryption Keys (DEKs) for every individual file, providing complete confidentiality at rest.
                  </p>
                </div>
              </FadeIn>

              {/* Feature 2 */}
              <FadeIn delay={250}>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-3">Cryptographic Signatures</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    Approvals are mathematically bound to specific document versions using Elliptic Curve Digital Signature Algorithm (ECDSA P-256), ensuring absolute non-repudiation.
                  </p>
                </div>
              </FadeIn>

              {/* Feature 3 */}
              <FadeIn delay={400}>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-3">Immutability & Integrity</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    Tampering is detected instantly via strict SHA-256 document hashing and append-only HMAC chained audit logs, verified dynamically at the edge.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-100 bg-white text-center">
        <p className="text-sm text-zinc-400">
          Accemberg Technologies in collaboration with SRM
        </p>
      </footer>
    </div>
  );
}
