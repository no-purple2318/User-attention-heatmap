import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        // Verify real JWT from headers
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const user = await verifyJwt(token);

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
