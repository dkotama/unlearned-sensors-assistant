'use client'

import { useState, useCallback, useEffect } from 'react'
import Chatbox from './Chatbox'
import MultifunctionBox from './MultifunctionBox'
import { Card } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from './ui/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [nextAction, setNextAction] = useState<string>('none')
  const [simplifiedMessage, setSimplifiedMessage] = useState<string>('')
  const [lastConfirmTime, setLastConfirmTime] = useState(0)
  const [selectedModel, setSelectedModel] = useState<string>("meta-llama/llama-3.1-8b-instruct")
  const [isChangingModel, setIsChangingModel] = useState(false)
  const { toast } = useToast()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const models = [
    { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 (8B)" },
    { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 (70B)" },
    { id: "meta-llama/llama-3-8b-instruct", name: "Llama 3 (8B)" },
    { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 (70B)" },
    { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 (17B) Free"}
  ]

  // Clear chat history on page load
  useEffect(() => {
    const resetChat = async () => {
      try {
        await fetch(`${apiUrl}/api/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Error resetting conversation on page load:', error)
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please refresh the page.",
          variant: "destructive",
        })
      }
    }
    
    resetChat()
  }, [])

  // Handle responses from Chatbox with improved confirmation detection
  const handleChatResponse = useCallback((action: string, simplifiedMsg: string, history: Message[]) => {
    console.log(`ChatInterface: Received action '${action}', message: '${simplifiedMsg.substring(0, 50)}...'`);
    
    // Check if we need to override the action based on message content
    let finalAction = action;
    
    // If the message contains confirmation phrases but action isn't set to confirm_sensor
    if (action !== 'confirm_sensor' && 
        (simplifiedMsg.includes("match your needs") || 
         simplifiedMsg.includes("Please respond with") || 
         simplifiedMsg.includes("yes or no") ||
         simplifiedMsg.toLowerCase().includes("does this sensor match"))) {
      console.log("Overriding action to 'confirm_sensor' based on message content");
      finalAction = 'confirm_sensor';
    }
    
    setNextAction(finalAction);
    setSimplifiedMessage(simplifiedMsg);
    setChatHistory(history);
    
    // If changing model, we can now set it back to false since we got a response
    if (isChangingModel) {
      setIsChangingModel(false)
      toast({
        title: "Model Changed",
        description: `Now using ${selectedModel.split('/').pop()}`,
      })
    }
  }, [isChangingModel, selectedModel])

  // Handle model changes
  const handleModelChange = (newModel: string) => {
    if (newModel !== selectedModel) {
      setIsChangingModel(true)
      setSelectedModel(newModel)
      toast({
        title: "Changing Model",
        description: `Switching to ${newModel.split('/').pop()}`,
      })
    }
  }

  // Handle confirmations from MultifunctionBox with rate limiting
  const handleConfirm = useCallback(async (answer: string, autoConfirm: boolean = false) => {
    // Prevent spamming by checking time since last confirmation
    const now = Date.now()
    if (now - lastConfirmTime < 1000) {
      console.log('Confirmation throttled to prevent spamming')
      return
    }
    
    setLastConfirmTime(now)
    
    try {
      // Set loading state for MultifunctionBox here
      setNextAction('loading') // This will trigger loading state in MultifunctionBox
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: answer, 
          auto_confirm: autoConfirm,
          model: selectedModel 
        }),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const data = await response.json()
      setNextAction(data.next_action)
      setSimplifiedMessage(data.simplified_message)
      setChatHistory(data.chat_history)
    } catch (error) {
      console.error('Error:', error)
      setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
      setNextAction('none')
      setSimplifiedMessage('Sorry, something went wrong.')
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      })
    }
  }, [lastConfirmTime, selectedModel, apiUrl])

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="p-2 bg-gray-100 flex justify-between items-center">
        <div className="text-sm font-medium pl-2">
          Unlearned Sensors Assistant
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Model:</span>
          <Select 
            value={selectedModel} 
            onValueChange={handleModelChange} 
            disabled={isChangingModel}
          >
            <SelectTrigger className={`w-[200px] ${isChangingModel ? 'opacity-70' : ''}`}>
              <SelectValue placeholder="Select model" />
              {isChangingModel && <span className="ml-2 animate-pulse">Changing...</span>}
            </SelectTrigger>
            <SelectContent>
              {models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left side: Chatbox */}
        <div className="w-1/2 h-full">
          <Card className="h-full w-full rounded-none">
            <Chatbox 
              onChatResponse={handleChatResponse} 
              initialChatHistory={chatHistory}
              selectedModel={selectedModel}
            />
          </Card>
        </div>
        {/* Right side: MultifunctionBox */}
        <div className="w-1/2 h-full">
          <Card className="h-full w-full rounded-none">
            <MultifunctionBox
              nextAction={nextAction}
              response={simplifiedMessage}
              onConfirm={handleConfirm}
              selectedModel={selectedModel}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}