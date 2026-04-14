import { useState, useEffect } from 'react'
import { Activity, Terminal } from 'lucide-react'
import { io } from 'socket.io-client'
import TerminalFeed from './components/TerminalFeed'
import MissionTable from './components/MissionTable'

// Connect to backend server
const socket = io('http://127.0.0.1:3000');

function App() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setOnline(true));
    socket.on('disconnect', () => setOnline(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glass-bg rounded-lg border border-glass-border">
            <Terminal className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ghostwriter<span className="text-neon-green">Agent</span></h1>
            <p className="text-sm text-gray-400">Autonomous CI/CD Self-Healing Node</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 glass-panel">
          <Activity className={`w-4 h-4 ${online ? 'text-neon-green' : 'text-red-500'}`} />
          <span className="text-sm font-medium tracking-wide">
            {online ? 'System Online' : 'Connecting...'}
          </span>
          {online && (
            <span className="relative flex h-2 w-2 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Terminal Stream */}
        <section className="lg:col-span-2 flex flex-col h-[70vh]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-neon-green">&gt;_</span> Live Thought Stream
          </h2>
          <TerminalFeed socket={socket} />
        </section>

        {/* Mission History */}
        <section className="h-[70vh] flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Mission History</h2>
          <MissionTable />
        </section>
      </main>
    </div>
  )
}

export default App
