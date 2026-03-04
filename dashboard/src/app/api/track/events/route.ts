import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { sessionId, events } = await req.json();

        // Since we are mocking JWT, let's grab the token from headers
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let user;
        try {
            user = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
        } catch (e) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        if (!user || !user.id || !sessionId || !events || !Array.isArray(events)) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        // Format events for Prisma bulk create
        const data = events.map((ev: any) => ({
            sessionId,
            timestamp: new Date(ev.t || Date.now()),
            type: ev.type, // MOUSE, SCROLL, EYE
            x: Number(ev.x) || 0,
            y: Number(ev.y) || 0,
        }));

        if (data.length > 0) {
            await prisma.eventLog.createMany({
                data,
            });
        }

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error("Events Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
