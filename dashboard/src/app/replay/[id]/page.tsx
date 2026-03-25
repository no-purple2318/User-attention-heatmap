import { prisma } from "@/lib/prisma";
import Replayer from "./Replayer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReplayPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await prisma.session.findUnique({
        where: { id: params.id },
    });

    if (!session) return notFound();

    // Fetch all events for this session, ordered by time
    const events = await prisma.eventLog.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: "asc" }
    });

    return <Replayer session={session} events={events} />;
}
