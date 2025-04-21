import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/ui/use-toast'
import Sidebar from './components/Sidebar'

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
            <Sidebar />
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}