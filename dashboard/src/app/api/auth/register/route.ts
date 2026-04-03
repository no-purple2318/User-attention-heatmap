import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Proxy request to the NestJS API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const authRes = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!authRes.ok) {
            const errData = await authRes.json();
            return NextResponse.json({ error: errData.message || 'Login failed' }, { status: authRes.status });
        }

        const data = await authRes.json();
        if (!data.user) {
            return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
        }

        const res = NextResponse.json({ success: true, user: data.user });

        // Stamp the dashboard_user HTTP-only cookie
        res.cookies.set('dashboard_user', JSON.stringify(data.user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return res;
    } catch (error) {
        console.error('NestJS Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
