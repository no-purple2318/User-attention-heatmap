import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, password, role } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // For demonstration, we'll auto-register the user if they don't exist
        // In a real app, you'd verify the password hash
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: "dummy-hash", // REPLACE WITH REAL HASHING in production
                    role: role || "USER",
                },
            });
        }

        // Usually you'd use a real JWT library here (e.g. jose or jsonwebtoken)
        // For simplicity of this extension demo, returning the user document base64
        const token = Buffer.from(JSON.stringify(user)).toString('base64');

        return NextResponse.json({ token, user, message: "Logged in successfully" });
    } catch (error) {
        console.error("Login Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
