import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const rawUser = cookieStore.get("dashboard_user")?.value;

    if (!rawUser) {
        // Fallback or explicit redirect
        redirect("/login");
    }

    const cookieUser = JSON.parse(rawUser);
    const user = await prisma.user.findUnique({ where: { id: cookieUser.id } });

    if (!user) redirect("/login");

    const sessions = await prisma.session.findMany({
        where: { userId: user!.id },
        include: { _count: { select: { events: true } } },
        orderBy: { startTime: 'desc' }
    });

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Your Heatmap Sessions</h1>
                    <div className="text-sm font-medium text-slate-400 badge bg-slate-900 px-4 py-2 border border-slate-800 rounded-full">Logged in as {user.email}</div>
                </header>

                <div className="grid grid-cols-1 gap-4 mt-8">
                    {sessions.map((s: any) => (
                        <Link key={s.id} href={`/replay/${s.id}`} className="group block bg-slate-900 border border-slate-800 p-6 rounded-xl hover:shadow-xl hover:border-blue-500/50 transition-all duration-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-200 group-hover:text-blue-400 transition-colors truncate max-w-xl">{s.url}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{s.startTime.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500 mt-1">{s._count.events} events recorded</p>
                                </div>
                                <div className="text-blue-500 font-medium whitespace-nowrap ml-4">Replay &rarr;</div>
                            </div>
                        </Link>
                    ))}

                    {sessions.length === 0 && (
                        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
                            <p className="text-slate-300 font-medium">No tracking sessions yet.</p>
                            <p className="text-slate-500 text-sm mt-1">Use the Chrome extension to record a session, then refresh this page to view analytics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
