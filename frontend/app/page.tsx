'use client'

import ChatInterface from './components/ChatInterface'

export default function Home() {
  return (
    <main className="h-screen p-4"> {/* Provide height and padding */}
      <ChatInterface />
    </main>
  )
}
