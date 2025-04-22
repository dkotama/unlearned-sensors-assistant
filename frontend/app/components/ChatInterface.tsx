import React, { useState, useEffect, useCallback } from 'react';
import Chatbox from './Chatbox';
import MultifunctionBox from './MultifunctionBox'; // Import MultifunctionBox
import { useToast } from "@/app/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
  
  // Debug logs for initial state
  console.log("ChatInterface initial render - chatHistory type:",
    Array.isArray(chatHistory) ?
    `Array with ${chatHistory.length} items` :
    typeof chatHistory);

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
        console.log(`%cChatInterface: Constructed Cloud Workstations API URL: ${apiUrl}`, 'color: purple; font-weight: bold;');
      } else {
        // Fallback to env var if not in browser
        apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
        console.log(`%cChatInterface: Using environment variable API URL: ${apiUrl}`, 'color: purple;');
      }
    } catch (e) {
      console.error('Error constructing Cloud Workstations URL:', e);
      // Fallback to env var
      apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
    }
  } else {
    // Local development
    apiUrl = 'http://localhost:8000';
    console.log(`%cChatInterface: Using local API URL: ${apiUrl}`, 'color: purple;');
  }

  useEffect(()  => {
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
    
    // Detailed debug logging for history parameter
    console.log("handleChatResponse received history:", {
      type: typeof history,
      isArray: Array.isArray(history),
      length: history?.length,
      firstItem: history?.[0] ? {
        type: typeof history[0],
        isMessageObj: history[0] && typeof history[0] === 'object' && 'role' in history[0] && 'content' in history[0],
        value: history[0]
      } : null
    });
    
    if (history) {
        // Make sure history is a properly formatted Message array
        if (Array.isArray(history)) {
            const validHistory = history.map(msg => {
                // If msg is a string, convert it to a Message object
                if (typeof msg === 'string') {
                    console.log("Converting string to Message object:", msg);
                    return { role: 'assistant' as const, content: msg };
                }
                // If it's already a Message object with correct types, keep it as is
                if (typeof msg === 'object' && msg !== null &&
                    ('role' in msg) && ('content' in msg) &&
                    (msg.role === 'user' || msg.role === 'assistant')) {
                    return msg as Message;
                }
                // Otherwise create a default Message
                console.warn("Unexpected message format:", msg);
                return { role: 'assistant' as const, content: String(msg) };
            });
            setChatHistory(validHistory);
        } else {
            console.error("Invalid history format - not an array:", history);
        }
    }
    console.log("ChatInterface updated state:", { action, simplifiedMsg, historyLength: history?.length });
  }, []);

  const sendApiRequest = useCallback(async (message: string) => {
    console.log(`ChatInterface: Sending API request for message: ${message}`);
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const response = await fetch(`${apiUrl}/api/v1/chat`, {
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
      sendApiRequest("yes");  // Send literal "yes" instead of "Confirm"
    } else {
      sendApiRequest("no");   // Send literal "no" instead of "Decline"
    }
  }, [sendApiRequest]);

  return (
    <div className="flex h-full w-full gap-4 p-4">
      <Card className="w-1/2 h-full flex flex-col">
        <Chatbox
          initialChatHistory={chatHistory}
          selectedModel={selectedModel}
          onChatResponse={handleChatResponse}
          onModelChange={setSelectedModel}
          models={models}
        />
      </Card>
      <div className="w-1/2 h-full">
        <MultifunctionBox
          nextAction={nextAction}
          response={simplifiedMessage}
          selectedModel={selectedModel}
          onConfirm={handleMultifunctionBoxConfirm}
          models={models}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
}

export default ChatInterface;
