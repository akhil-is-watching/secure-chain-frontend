import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="SecureChain Logo" 
            width={40} 
            height={40}
            className="rounded-lg bg-white/10 p-1"
          />
          <h1 className="text-2xl font-bold">SecureChain</h1>
        </div>
        <nav className="hidden md:flex gap-8">
          <a href="#features" className="hover:text-indigo-300 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-300 transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-indigo-300 transition-colors">Pricing</a>
        </nav>
      </header>

      <main className="flex flex-col gap-[64px] items-center justify-center">
        <section className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Tamper-Resistant Document Sharing with Blockchain Security
          </h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            Share sensitive documents with military-grade encryption, blockchain verification, 
            and complete privacy using Ethereum and IPFS technology.
          </p>
          <div className="flex gap-4 items-center flex-col sm:flex-row justify-center">
            <a
              className="rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 font-medium text-base h-12 px-8 w-full sm:w-auto"
              href="/auth"
            >
              Get Started Free
            </a>
            <a
              className="rounded-full border border-solid border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center font-medium text-base h-12 px-8 w-full sm:w-auto"
              href="#demo"
            >
              Watch Demo
            </a>
          </div>
        </section>

        <section id="features" className="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="bg-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/shield.svg" alt="Encryption" width={24} height={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">End-to-End Encryption</h3>
            <p className="text-indigo-200">
              Advanced cryptographic techniques including Diffie-Hellman key exchange ensure 
              only intended recipients can access your documents.
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="bg-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/eth.svg" alt="Blockchain" width={24} height={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Blockchain Verification</h3>
            <p className="text-indigo-200">
              Document hashes stored on Ethereum blockchain provide tamper-proof verification 
              and immutable audit trails.
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="bg-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/ipfs.svg" alt="Privacy" width={24} height={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Privacy-First Design</h3>
            <p className="text-indigo-200">
              IPFS distributed storage with symmetric key re-encryption ensures your data 
              remains private and secure at all times.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold mb-10 text-center">How It Works</h2>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-indigo-700 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Upload & Encrypt</h3>
                <p className="text-indigo-200">
                  Upload your document and it's automatically encrypted with a unique key. 
                  The document is stored on IPFS, not on centralized servers.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-indigo-700 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Blockchain Verification</h3>
                <p className="text-indigo-200">
                  A hash of your document is recorded on the Ethereum blockchain, creating 
                  an immutable record that can verify the document hasn't been tampered with.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-indigo-700 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Secure Sharing</h3>
                <p className="text-indigo-200">
                  When sharing, Diffie-Hellman key exchange creates a secure channel to share 
                  the encryption key only with your intended recipient.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/20 pt-8">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="SecureChain Logo" 
            width={24} 
            height={24}
          />
          <span>© 2025 SecureChain. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="text-indigo-300 hover:text-white transition-colors">Privacy</a>
          <a href="/terms" className="text-indigo-300 hover:text-white transition-colors">Terms</a>
          <a href="/contact" className="text-indigo-300 hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
