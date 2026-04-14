import { useState } from 'react';

export default function MissionTable() {
    const [missions, setMissions] = useState([
        {
            id: "MSN-101",
            repo: "acme-corp/api-service",
            pr: "#42",
            status: "success",
            time: "2 mins ago"
        },
        {
            id: "MSN-100",
            repo: "acme-corp/frontend",
            pr: "#89",
            status: "failed",
            time: "1 hr ago"
        }
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-neon-green bg-[#00FF66]/10 border-[#00FF66]/20';
            case 'failed': return 'text-deep-red bg-[#FF3366]/10 border-[#FF3366]/20';
            case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    return (
        <div className="glass-panel flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
                {missions.length === 0 ? (
                    <div className="text-gray-500 text-center py-8 text-sm">No missions recorded yet.</div>
                ) : missions.map(mission => (
                    <div
                        key={mission.id}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-gray-400">{mission.id}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider ${getStatusColor(mission.status)}`}>
                                {mission.status}
                            </span>
                        </div>
                        <div className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">
                            {mission.repo}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                            <span className="text-blue-400 hover:underline">PR {mission.pr}</span>
                            <span>{mission.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
