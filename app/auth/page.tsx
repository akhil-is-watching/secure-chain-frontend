"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Here you would implement your actual authentication logic
      // For example, calling your API endpoint for login or registration
      console.log(isLogin ? "Logging in..." : "Registering...", { email, password, name });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard after successful auth
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-white hover:text-indigo-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <Image 
            src="/logo.png" 
            alt="SecureChain Logo" 
            width={48} 
            height={48}
            className="rounded-lg bg-white/10 p-2"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          {isLogin ? "Sign In to SecureChain" : "Create Your Account"}
        </h1>
        
        <div className="flex rounded-lg bg-white/5 p-1 mb-8">
          <button 
            className={`flex-1 py-2 rounded-md text-center transition-colors ${isLogin ? 'bg-indigo-600 text-white' : 'text-white/70 hover:text-white'}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-2 rounded-md text-center transition-colors ${!isLogin ? 'bg-indigo-600 text-white' : 'text-white/70 hover:text-white'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="Enter your full name"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder={isLogin ? "Enter your password" : "Create a strong password"}
              required
            />
          </div>
          
          {isLogin && (
            <div className="flex justify-end">
              <Link href="/auth/reset-password" className="text-sm text-indigo-300 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isLogin ? "Sign In" : "Create Account"}
          </button>
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)} 
                className="text-indigo-300 hover:text-white transition-colors"
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-white/50 text-sm text-center">
        <p>By continuing, you agree to SecureChain's</p>
        <p className="flex gap-3 justify-center mt-1">
          <Link href="/terms" className="text-indigo-300 hover:text-white transition-colors">Terms of Service</Link>
          <span>&</span>
          <Link href="/privacy" className="text-indigo-300 hover:text-white transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
} 