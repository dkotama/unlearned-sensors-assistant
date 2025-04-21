'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatboxProps {
  onChatResponse: (action: string, simplifiedMessage: string, chatHistory: Message[]) => void
  initialChatHistory: Message[]
  selectedModel: string
}

export default function Chatbox({ onChatResponse, initialChatHistory, selectedModel }: ChatboxProps) {
  const [chatHistory, setChatHistory] = useState<Message[]>(initialChatHistory)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationCooldown, setConfirmationCooldown] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    setChatHistory(initialChatHistory)
  }, [initialChatHistory])

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [chatHistory])

  const resetConversation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Network response was not ok')
      
      setChatHistory([])
      onChatResponse('none', '', [])
    } catch (error) {
      console.error('Error resetting conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return  // Prevent sending when loading

    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          model: selectedModel 
        }),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const data = await response.json()
      setChatHistory(data.chat_history)
      onChatResponse(data.next_action, data.simplified_message, data.chat_history)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, something went wrong.' }
      setChatHistory((prev) => [...prev, errorMessage])
      onChatResponse('none', 'Sorry, something went wrong.', chatHistory)
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle>Chatbox</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetConversation} 
          disabled={isLoading}
          title="Reset conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100vh-140px)]">
        <ScrollArea className="flex-1 mb-4 p-4 border rounded-md" ref={chatBoxRef}>
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 text-left">
              <span className="inline-block p-2 rounded-lg bg-gray-200 text-gray-800">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assistant is thinking...</span>
                </div>
              </span>
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2 mt-auto pb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading}
            className={isLoading ? "opacity-70 cursor-not-allowed" : ""}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </CardContent>
    </>
  )
}