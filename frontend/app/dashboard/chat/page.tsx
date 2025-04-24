'use client'
 
import ChatInterface from '../../components/ChatInterface'
import { AppSidebar } from '../../components/app-sidebar'
 
export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto ml-64 p-4">
        <ChatInterface />
      </main>
    </div>
  )
}