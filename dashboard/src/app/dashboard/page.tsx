import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Play, Activity, Clock, Globe, MousePointerClick, Eye, LogOut } from "lucide-react";
import LogoutButton from "./LogoutButton";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
    // Read the user from the httpOnly cookie set at login
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get("dashboard_user")?.value;

    if (!rawCookie) {
        redirect("/login");
    }

    let cookieUser: { id: string; email: string; role: string };
    try {
        cookieUser = JSON.parse(rawCookie);
    } catch {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({ where: { id: cookieUser.id } });
    if (!user) redirect("/login");

    const sessionsData = await prisma.session.findMany({
        where: { userId: user.id },
        include: {
            events: {
                select: { type: true, timestamp: true }
            }
        },
        orderBy: { startTime: 'desc' }
    });

    // Compute analytics per session
    const sessions = sessionsData.map((s, idx) => {
        const mouseEvents = s.events.filter(e => e.type === 'MOUSE' || e.type === 'SCROLL').length;
        const eyeEvents = s.events.filter(e => e.type === 'EYE').length;
        const totalEvents = s.events.length;

        let durationMs = 0;
        let density = "Low";
        let densityColor = "text-slate-400";

        if (totalEvents > 0) {
            const firstEvent = s.events.reduce((a, b) => a.timestamp < b.timestamp ? a : b).timestamp;
            const lastEvent = s.events.reduce((a, b) => a.timestamp > b.timestamp ? a : b).timestamp;
            durationMs = lastEvent.getTime() - firstEvent.getTime();

            const eps = totalEvents / Math.max((durationMs / 1000), 1);
            if (eps > 20) { density = "High"; densityColor = "text-emerald-400"; }
            else if (eps > 5) { density = "Medium"; densityColor = "text-blue-400"; }
        }

        return { ...s, totalEvents, mouseEvents, eyeEvents, durationSec: (durationMs / 1000).toFixed(1), density, densityColor, delayIdx: idx };
    });

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '0ms' }}>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm flex items-center gap-3">
                            <Activity className="text-blue-500" /> Attention Dashboard
                        </h1>
                        <p className="text-slate-400 mt-2 font-light">Manage and replay your recorded user sessions.</p>
                    </div>

                    {/* User badge + Logout */}
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium bg-slate-800/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                            <span className="text-slate-300">{user.email}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 ml-1">{user.role}</span>
                        </div>
                        <LogoutButton />
                    </div>
                </header>

                <div className="grid gap-6">
                    {sessions.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-900/30 border border-slate-800/60 rounded-2xl backdrop-blur-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
                            <Globe className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" />
                            <h3 className="text-xl text-slate-300 mb-2 font-medium">No Sessions Recorded</h3>
                            <p>Use the Chrome extension to start tracking user attention on websites.</p>
                        </div>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s.id}
                                className="group flex flex-col xl:flex-row xl:items-center justify-between p-6 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all duration-300 backdrop-blur-md shadow-lg animate-slide-up"
                                style={{ animationDelay: `${(s.delayIdx + 1) * 100}ms` }}
                            >
                                <div className="mb-5 xl:mb-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                            <Globe size={18} />
                                        </div>
                                        <h3 className="font-medium text-lg text-white truncate max-w-xl">{s.url}</h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-400 mt-2 ml-1">
                                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> {s.startTime.toLocaleString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                                        <span className="flex items-center gap-1.5"><Play size={14} className="text-slate-500" /> {s.durationSec}s active</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                                        <span className="flex items-center gap-1.5"><MousePointerClick size={14} className="text-slate-500" /> {s.mouseEvents} mouse</span>
                                        <span className="flex items-center gap-1.5"><Eye size={14} className="text-blue-500/70" /> {s.eyeEvents} gaze</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                                        <span className="flex items-center gap-1.5">Density: <strong className={`font-semibold ${s.densityColor}`}>{s.density}</strong></span>
                                    </div>
                                </div>
                                <Link
                                    href={`/replay/${s.id}`}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] whitespace-nowrap"
                                >
                                    <Play size={18} className="translate-x-0.5" />
                                    <span>Watch Replay</span>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
