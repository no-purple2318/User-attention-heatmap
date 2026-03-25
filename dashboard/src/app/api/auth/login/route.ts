import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Proxy login request to new NestJS backend
        const nestRes = await fetch("http://localhost:3001/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await nestRes.json();

        if (!nestRes.ok) {
            return NextResponse.json({ error: data.message || "Login failed via backend" }, { status: nestRes.status });
        }

        const { user } = data;
        const response = NextResponse.json({ user, message: "Logged in successfully" });

        // Retain Next.js session cookie functionality for the dashboard UI
        response.cookies.set("dashboard_user", JSON.stringify({ id: user.id, email: user.email, role: user.role }), {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "lax",
        });

        return response;
    } catch (error) {
        console.error("Login Proxy Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error (Backend Unreachable)" },
            { status: 500 }
        );
    }
}

