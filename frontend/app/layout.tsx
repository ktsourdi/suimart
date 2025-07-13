import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../components/ThemeProvider'
import { WalletContextProvider } from '../components/WalletProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Suimart - Premier Sui Blockchain Marketplace',
  description: 'Discover, buy, and sell unique digital items on the Sui blockchain with unparalleled ease.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <ThemeProvider>
          <WalletContextProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
              {/* Modern Navigation */}
              <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-gradient">
                        Suimart
                      </div>
                      <div className="hidden md:flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Live</span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                      <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-gradient transition-colors duration-200 font-medium">
                        Home
                      </a>
                      <a href="/auction" className="text-gray-700 dark:text-gray-300 hover:text-gradient transition-colors duration-200 font-medium">
                        Auctions
                      </a>
                      <a href="/sell" className="text-gray-700 dark:text-gray-300 hover:text-gradient transition-colors duration-200 font-medium">
                        Sell
                      </a>
                      <a href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-gradient transition-colors duration-200 font-medium">
                        Profile
                      </a>
                    </div>

                    {/* Right side - Theme toggle and wallet */}
                    <div className="flex items-center space-x-4">
                      {/* Theme Toggle */}
                      <button className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </button>

                      {/* Mobile menu button */}
                      <button className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Main Content */}
              <main className="relative">
                {/* Background decoration */}
                <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 pointer-events-none"></div>
                <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                  {children}
                </div>
              </main>

              {/* Footer */}
              <footer className="relative z-10 mt-20 border-t border-white/20 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-12">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                      <div className="text-2xl font-bold text-gradient">Suimart</div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        The premier marketplace for Sui blockchain assets. Discover, buy, and sell unique digital items.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Marketplace</h3>
                      <div className="space-y-2 text-sm">
                        <a href="/" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Browse Items</a>
                        <a href="/auction" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Auctions</a>
                        <a href="/sell" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Sell Items</a>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Account</h3>
                      <div className="space-y-2 text-sm">
                        <a href="/profile" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Profile</a>
                        <a href="/settings" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Settings</a>
                        <a href="/help" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Help</a>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Connect</h3>
                      <div className="space-y-2 text-sm">
                        <a href="/discord" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Discord</a>
                        <a href="/twitter" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Twitter</a>
                        <a href="/github" className="block text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">GitHub</a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/20 dark:border-slate-700/50">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        © 2024 Suimart. All rights reserved.
                      </p>
                      <div className="flex items-center space-x-6 text-sm">
                        <a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Privacy</a>
                        <a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Terms</a>
                        <a href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-gradient transition-colors">Cookies</a>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}