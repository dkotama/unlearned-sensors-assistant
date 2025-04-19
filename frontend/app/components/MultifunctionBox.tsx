'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type Mode = 'question' | 'upload' | 'result' | null

export default function MultifunctionBox() {
  const [mode, setMode] = useState<Mode>(null)
  const [question, setQuestion] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [extractionResult, setExtractionResult] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleYesNoQuestion = () => {
    setMode('question')
    setQuestion('Do you want to proceed?')
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return

    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setExtractionResult(data.extractedText)
      setMode('result')
    } catch (error) {
      console.error('Error:', error)
      setExtractionResult('Failed to extract text from PDF.')
      setMode('result')
    }
  }

  const renderContent = () => {
    switch (mode) {
      case 'question':
        return (
          <div>
            <p>{question}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setMode(null)}>Yes</Button>
              <Button onClick={() => setMode(null)}>No</Button>
            </div>
          </div>
        )
      case 'upload':
        return (
          <div>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <Button onClick={handleFileUpload} className="mt-2">
              Upload and Extract
            </Button>
          </div>
        )
      case 'result':
        return (
          <div>
            <h3>Extraction Result:</h3>
            <p>{extractionResult}</p>
            <Button onClick={() => setMode(null)} className="mt-2">
              Close
            </Button>
          </div>
        )
      default:
        return (
          <div>
            <Button onClick={handleYesNoQuestion} className="mr-2">
              Ask Question
            </Button>
            <Button onClick={() => setMode('upload')}>Upload PDF</Button>
          </div>
        )
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Multifunction Box</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}