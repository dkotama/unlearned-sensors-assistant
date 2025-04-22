import React, { useState, useEffect, useCallback } from 'react';
import Chatbox from './Chatbox';
import MultifunctionBox from './MultifunctionBox'; // Import MultifunctionBox
import { useToast } from "@/app/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'; // Import Card components

// Define Message type if not already globally available
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ChatInterface() {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [nextAction, setNextAction] = useState('none');
  const [simplifiedMessage, setSimplifiedMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.1-8b-instruct');

  const isCloudWorkstations = process.env.NEXT_PUBLIC_CLOUD_WORKSTATIONS === 'true';
  const defaultApiUrl = 'http://localhost:8000';
  const cloudWorkstationsApiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
  const apiUrl = isCloudWorkstations ? cloudWorkstationsApiUrl : defaultApiUrl;

  useEffect(() => {
    console.log(`ChatInterface: Using API URL: ${apiUrl}`);
  }, [apiUrl]);

  const models = [
    { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 (8B)" },
    { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 (70B)" },
    { id: "meta-llama/llama-3-8b-instruct", name: "Llama 3 (8B)" },
    { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 (70B)" },
    { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 (17B) Free"}
  ];

  const handleChatResponse = useCallback((action: string, simplifiedMsg: string, history: Message[]) => {
    setNextAction(action);
    setSimplifiedMessage(simplifiedMsg);
    if (history) {
        setChatHistory(history);
    }
    console.log("ChatInterface updated state:", { action, simplifiedMsg, historyLength: history?.length });
  }, []);

  const sendApiRequest = useCallback(async (message: string) => {
    console.log(`ChatInterface: Sending API request for message: ${message}`);
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model: selectedModel }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log(`ChatInterface: Received API response for ${message}:`, data);
      handleChatResponse(data.next_action, data.simplified_message, data.chat_history);
    } catch (error: any) {
      console.error(`Error sending API request for ${message}:`, error);
      const errorMessage = `Sorry, failed to process '${message}'. ${error.message || 'Please try again.'}`;
      setChatHistory((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
      setNextAction('none');
      setSimplifiedMessage(errorMessage);
      toast({ title: "Error", description: `Failed to process action: ${message}. ${error.message || ''}`, variant: "destructive" });
    }
  }, [apiUrl, selectedModel, handleChatResponse, toast]);

  const handleMultifunctionBoxConfirm = useCallback((answer: 'yes' | 'no') => {
    console.log(`ChatInterface: Received confirmation from MultifunctionBox: ${answer}`);
    if (answer === 'yes') {
      sendApiRequest("Confirm");
    } else {
      sendApiRequest("Decline");
    }
  }, [sendApiRequest]);

  return (
    <div className="flex h-full gap-4">
      {/* Left side: Chat area - Now 50% width */}
      <div className="w-1/2 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <Chatbox
            initialChatHistory={chatHistory}
            selectedModel={selectedModel} // Keep passing model for context if needed by Chatbox
            onChatResponse={handleChatResponse}
          />
        </Card>

        {/* REMOVED Model Selection Drawer Trigger */}
        {/* <div className="text-right"> ... Drawer code ... </div> */}
      </div>

      {/* Right side: Multifunction Box - Now 50% width */}
      <div className="w-1/2 flex flex-col">
        {/* Pass model state and handler to MultifunctionBox */}
        <MultifunctionBox
          nextAction={nextAction}
          response={simplifiedMessage}
          selectedModel={selectedModel} // Pass current value
          onConfirm={handleMultifunctionBoxConfirm}
          models={models} // Pass available models
          onModelChange={setSelectedModel} // Pass state setter function
        />
      </div>
    </div>
  );
}

export default ChatInterface;
