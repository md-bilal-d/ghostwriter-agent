import { useEffect, useRef, useState } from 'react';

export default function TerminalFeed({ socket }) {
    const [logs, setLogs] = useState([
        "[System] Initializing Ghostwriter Environment...",
        "[System] Waiting for GitHub Webhooks on /api/webhooks/github...",
    ]);
    const terminalRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('agent_log', (data) => {
            setLogs(prev => [...prev, data.text]);
        });

        return () => {
            socket.off('agent_log');
        };
    }, [socket]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div
            className="glass-panel flex-1 p-4 font-mono text-sm overflow-y-auto relative"
            ref={terminalRef}
        >
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[var(--color-dark-bg)] to-transparent pointer-events-none rounded-t-xl z-10 opacity-50"></div>

            <div className="space-y-1 mt-2">
                {logs.map((log, index) => {
                    let colorClass = "text-gray-300";
                    if (log.includes("[Error]") || log.includes("FAILED")) colorClass = "text-deep-red";
                    else if (log.includes("[Success]") || log.includes("SUCCESS")) colorClass = "text-neon-green";
                    else if (log.includes("[Agent]")) colorClass = "text-blue-400";
                    else if (log.includes("[Sandbox]")) colorClass = "text-purple-400";

                    return (
                        <div key={index} className={`break-words ${colorClass}`}>
                            {log}
                        </div>
                    );
                })}
                <div className="animate-pulse text-neon-green mt-2">_</div>
            </div>
        </div>
    );
}
