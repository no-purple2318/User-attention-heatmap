import prisma from '@/lib/prisma';
import Replayer from './Replayer';

export const dynamic = "force-dynamic";

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const sessionData = await prisma.session.findUnique({
        where: { id },
        include: { events: { orderBy: { timestamp: 'asc' } } }
    });

    if (!sessionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-mono">
                Session not found or unavailable.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col pt-12 items-center text-white font-sans">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Heatmap Replay</h1>
                <p className="text-zinc-400 text-sm mt-1 opacity-80">{sessionData.url}</p>
            </div>

            <div className="relative w-[1200px] h-[800px] bg-white border border-zinc-800 shadow-2xl rounded-xl overflow-hidden ring-4 ring-zinc-900/50">
                <Replayer events={sessionData.events} />
            </div>
        </div>
    );
}
