import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });
    // Clear the auth cookie
    response.cookies.set("dashboard_user", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0),
        sameSite: "lax",
    });
    return response;
}
