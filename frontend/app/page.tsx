import Chatbox from './components/Chatbox'
import MultifunctionBox from './components/MultifunctionBox'

export default function Home() {
  return (
    <main className="flex-1 flex">
      <div className="w-1/2 border-r">
        <Chatbox />
      </div>
      <div className="w-1/2">
        <MultifunctionBox />
      </div>
    </main>
  )
}