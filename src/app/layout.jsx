import { Inter } from 'next/font/google'
import '../app/global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Provider Lead Distribution System',
  description: 'Automated lead distribution with fair allocation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">LeadDistribution</span>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a href="/" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-700">
                      Home
                    </a>
                    <a href="/request-service" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                      Request Service
                    </a>
                    <a href="/dashboard" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                      Provider Dashboard
                    </a>
                    <a href="/test-tools" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                      Test Tools
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-800">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}