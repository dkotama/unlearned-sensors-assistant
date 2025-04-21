'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'

// Dummy sensor database for default state
const sensorDatabase = [
  { name: 'DS18B20', type: 'Temperature Sensor', useCase: 'Measure temperature in IoT projects' },
  { name: 'DHT22', type: 'Humidity Sensor', useCase: 'Monitor humidity and temperature' },
  { name: 'PIR Sensor', type: 'Motion Sensor', useCase: 'Detect motion for security systems' },
  { name: 'MQ-2', type: 'Gas Sensor', useCase: 'Detect gas leaks in smart homes' },
]

type Mode = 'question' | 'upload' | 'result' | 'default' | 'loading'

interface MultifunctionBoxProps {
  nextAction: string
  response: string
  onConfirm: (answer: string, autoConfirm?: boolean) => void
  onUpload: (file: File) => void
  selectedModel: string
}

export default function MultifunctionBox({ 
  nextAction, 
  response, 
  onConfirm, 
  onUpload, 
  selectedModel 
}: MultifunctionBoxProps) {
  const [mode, setMode] = useState<Mode>('default')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [buttonsDisabled, setButtonsDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Update mode based on nextAction with debugging
  useEffect(() => {
    console.log(`MultifunctionBox: nextAction changed to '${nextAction}', response: '${response.substring(0, 50)}...'`);
    
    if (nextAction === 'confirm_sensor') {
      setMode('question');
      setIsLoading(false);
      console.log("Setting mode to 'question' for confirmation");
    } else if (nextAction === 'pdf_upload') {
      setMode('upload')
      setIsLoading(false)
    } else if (nextAction === 'continue') {
      setMode('result')
      setResult('Sensor setup confirmed. Proceeding with setup.')
      setIsLoading(false)
    } else if (nextAction === 'none') {
      setMode('default')
      setResult(null)
      setIsLoading(false)
    } else if (nextAction === 'loading') {
      // Handle the new loading state
      setIsLoading(true)
      // Keep current mode, just show loading indicator
    }
    
    // Force question mode if response contains confirmation phrases, even if nextAction isn't set properly
    if (response.includes("match your needs") || response.includes("Please respond with") || 
        response.includes("yes or no") || response.includes("Does this sensor match")) {
      console.log("Forcing question mode based on response content");
      setMode('question');
      setIsLoading(false);
    }
  }, [nextAction, response])

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please select a PDF file first");
      return;
    }
    
    setIsLoading(true);
    setUploadError(null);
    
    try {
      onUpload(uploadFile);
    } catch (error) {
      setUploadError("Error uploading file. Please try again.");
      setIsLoading(false);
    }
  }

  const handleYes = () => {
    if (buttonsDisabled) return;
    
    // Disable buttons and show loading state
    setButtonsDisabled(true);
    setIsLoading(true);
    onConfirm('yes', true);
    
    // Re-enable after a delay to prevent spamming
    setTimeout(() => {
      setButtonsDisabled(false);
    }, 2000);
  }

  const handleNo = () => {
    if (buttonsDisabled) return;
    
    // Disable buttons and show loading state
    setButtonsDisabled(true);
    setIsLoading(true);
    onConfirm('no');
    
    // Re-enable after a delay to prevent spamming
    setTimeout(() => {
      setButtonsDisabled(false);
    }, 2000);
  }

  const renderContent = () => {
    // If we're loading, show a loading indicator regardless of mode
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Processing your request...</p>
        </div>
      );
    }

    switch (mode) {
      case 'question':
        return (
          <div>
            <p className="mb-2">
              <ReactMarkdown>{response}</ReactMarkdown>
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={handleYes} 
                disabled={buttonsDisabled}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes
              </Button>
              <Button 
                onClick={handleNo} 
                disabled={buttonsDisabled}
                className="bg-red-600 hover:bg-red-700"
              >
                No
              </Button>
            </div>
          </div>
        )
      case 'upload':
        return (
          <div>
            <p className="mb-4">{response}</p>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setUploadError(null);
                }}
                className="mb-2"
              />
              {uploadError && (
                <p className="text-red-500 text-sm mb-2">{uploadError}</p>
              )}
              <Button onClick={handleFileUpload} className="mt-2 w-full">
                Upload PDF
              </Button>
            </div>
          </div>
        )
      case 'result':
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">Result:</h3>
            <div className="bg-green-50 p-4 border border-green-200 rounded-md mb-4">
              <p>{result}</p>
            </div>
            <Button onClick={() => setMode('default')} className="mt-2">
              Back to Default
            </Button>
          </div>
        )
      case 'default':
      default:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Available Sensors</h3>
            <ul className="list-disc pl-4">
              {sensorDatabase.map((sensor, index) => (
                <li key={index} className="mb-2">
                  <strong>{sensor.name}</strong> ({sensor.type}): {sensor.useCase}
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p>Ask about a sensor setup to get started!</p>
              <p className="text-sm mt-1 text-gray-600">
                Current model: <span className="font-medium">{selectedModel.split('/').pop()}</span>
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle>Multifunction Box</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100vh-140px)]">
        <ScrollArea className="h-full p-4 border rounded-md">
          {renderContent()}
        </ScrollArea>
      </CardContent>
    </>
  )
}