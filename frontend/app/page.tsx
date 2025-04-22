'use client'

import ChatInterface from './components/ChatInterface'

export default function Home() {
  return (
    <main className="flex-1 h-full p-4"> {/* Take remaining space and provide padding */}
      <ChatInterface />
    </main>
  )
}
