import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Play } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
    // Mock logged-in user for demonstration. 
    // In a real app, you get this from a session cookie/JWT.
    const user = await prisma.user.findFirst();

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 text-gray-800">
                <p>No users registered yet. Please login via the extension first to create an account.</p>
            </div>
        );
    }

    const sessions = await prisma.session.findMany({
        where: { userId: user.id },
        include: {
            _count: { select: { events: true } }
        },
        orderBy: { startTime: 'desc' }
    });

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Attention Dashboard
                    </h1>
                    <div className="text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        Welcome, {user.email} ({user.role})
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/5 border border-blue-50 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-xl font-semibold">Your Recorded Sessions</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {sessions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No sessions recorded yet. Use the extension to start tracking!</div>
                        ) : (
                            sessions.map((s: any) => (
                                <div key={s.id} className="p-6 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                                    <div>
                                        <h3 className="font-medium text-lg text-blue-900">{s.url}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Started: {s.startTime.toLocaleString()} &bull; {s._count.events} events captured
                                        </p>
                                    </div>
                                    <Link
                                        href={`/replay/${s.id}`}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-transform active:scale-95 shadow-lg shadow-blue-600/20"
                                    >
                                        <Play size={18} />
                                        Replay
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
