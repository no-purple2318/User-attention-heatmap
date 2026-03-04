import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        // Since we are mocking JWT, let's grab the token from headers
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // Decode pseudo-token
        const userStr = Buffer.from(token, 'base64').toString('ascii');
        const user = JSON.parse(userStr);

        if (!user || !user.id) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                url: url || "unknown",
            }
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error("Session Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
