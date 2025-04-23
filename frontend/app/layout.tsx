import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/ui/use-toast'
import { AppSidebar } from './components/app-sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unlearned Sensors Assistant',
  description: 'An AI-powered assistant for IoT sensor selection and setup',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <div className="flex h-screen">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto ml-64">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}