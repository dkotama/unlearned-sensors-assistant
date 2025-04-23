import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AdminChatBlock() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([...messages, inputValue]);
      setInputValue('');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        {messages.map((msg, index) => (
          <Card key={index} className="mb-2">
            <CardHeader>Message {index + 1}</CardHeader>
            <CardContent>{msg}</CardContent>
          </Card>
        ))}
      </div>
      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          placeholder="Type a message..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}