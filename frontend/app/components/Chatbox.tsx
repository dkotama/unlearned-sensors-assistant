'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/components/ui/use-toast";

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatboxProps {
  onChatResponse: (action: string, simplifiedMessage: string, chatHistory: Message[]) => void
  initialChatHistory: Message[]
  selectedModel: string
  onModelChange: (modelId: string) => void
  models: { id: string; name: string }[]
}

export default function Chatbox({ onChatResponse, initialChatHistory, selectedModel, onModelChange, models }: ChatboxProps) {
  console.log('Chatbox initialChatHistory:', initialChatHistory, initialChatHistory.length > 0 ? typeof initialChatHistory[0] : 'undefined');
  const [chatHistory, setChatHistory] = useState<Message[]>(initialChatHistory);
  const { toast } = useToast();
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const isCloudWorkstations = process.env.NEXT_PUBLIC_CLOUD_WORKSTATIONS === 'true';
  
  // In cloud workstations, construct the URL with the correct port (8000)
  let apiUrl = '';
  if (isCloudWorkstations) {
    // Extract the hostname part from the window.location
    try {
      // First try to get from window.location if we're in the browser
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Replace the port part in the hostname
        apiUrl = `https://${hostname.replace(/^[^-]+-/, '8000-')}`;
        console.log(`%cChatbox: Constructed Cloud Workstations API URL: ${apiUrl}`, 'color: purple; font-weight: bold;');
      } else {
        // Fallback to env var if not in browser
        apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
        console.log(`%cChatbox: Using environment variable API URL: ${apiUrl}`, 'color: purple;');
      }
    } catch (e) {
      console.error('Error constructing Cloud Workstations URL:', e);
      // Fallback to env var
      apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
    }
  } else {
    // Local development
    apiUrl = 'http://localhost:8000';
    console.log(`%cChatbox: Using local API URL: ${apiUrl}`, 'color: purple;');
  }

  useEffect(() => {
    setChatHistory(initialChatHistory)
  }, [initialChatHistory]);

  // Track previous model to only show toast when model actually changes
  const prevModelRef = useRef(selectedModel);
  
  useEffect(() => {
    // Only show toast if the model changed (not on initial render)
    if (prevModelRef.current !== selectedModel) {
      const modelName = models.find(m => m.id === selectedModel)?.name || selectedModel;
      toast({
        title: "Model Changed",
        description: `Switched to ${modelName}`,
      });
      
      // Update ref to current model
      prevModelRef.current = selectedModel;
    }
  }, [selectedModel, models, toast]);

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
      const response = await fetch(`${apiUrl}/api/v1/reset`, {
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
      const response = await fetch(`${apiUrl}/api/v1/chat`, {
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
    <div className="flex flex-col h-full">
      <CardHeader className="pb-2 flex flex-row justify-between items-center border-b">
        <CardTitle>Chatbox</CardTitle>
        
        {/* Model selector in the center */}
        <div className="flex items-center gap-2">
          <Label htmlFor="model-select" className="text-sm font-medium whitespace-nowrap">AI Model:</Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger id="model-select" className="w-[200px] lg:w-[250px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
        <ScrollArea className="flex-1 -mx-4 min-h-[450px]" ref={scrollAreaRef}>
           <div className="px-4 space-y-4">
              {Array.isArray(chatHistory) && chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-2 px-3 rounded-lg text-sm ${
                      message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">
                      {message.role === 'user' ? 'User' : `Assistant (${models.find(m => m.id === selectedModel)?.name || selectedModel})`}
                    </div>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                         components={{
                            p: ({node, ...props}) => <p className="mb-0" {...props} />
                         }}
                      >{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
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
    </div>
  )
}
