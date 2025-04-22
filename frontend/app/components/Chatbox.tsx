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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    setChatHistory(initialChatHistory)
  }, [initialChatHistory])

  useEffect(() => {
    if (scrollAreaRef.current) {
       const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
       if (viewport) {
         viewport.scrollTop = viewport.scrollHeight;
       }
    }
  }, [chatHistory])

  const resetConversation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
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
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input };
    setChatHistory((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          model: selectedModel 
        }),
        credentials: 'include'
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
    }
  }

  return (
    <>
      <CardHeader className="pb-2 flex flex-row justify-between items-center border-b">
        <CardTitle>Chatbox</CardTitle>
        <Button 
          variant="ghost"
          size="sm" 
          onClick={resetConversation} 
          disabled={isLoading}
          title="Reset conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-4">
        {/* Added min-h-[300px] to the ScrollArea to ensure it always occupies some height */}
        <ScrollArea className="flex-1 -mx-4 mb-4" ref={scrollAreaRef} style={{minHeight: '300px'}}>
           <div className="px-4 space-y-4"> 
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <span
                    className={`inline-block max-w-[80%] p-2 px-3 rounded-lg text-sm ${
                      message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                         components={{
                            p: ({node, ...props}) => <p className="mb-0" {...props} />
                         }}
                      >{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <span className="inline-block p-2 px-3 rounded-lg bg-gray-100 text-gray-900">
                    <div className="flex items-center space-x-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </span>
                </div>
              )}
            </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </CardContent>
    </>
  )
}
