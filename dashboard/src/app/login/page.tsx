'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent, endpoint: 'login' | 'register') => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setErrorMsg(`${endpoint === 'login' ? 'Login' : 'Registration'} failed: ` + (data.error || 'Invalid credentials'));
            }
        } catch (err) {
            setErrorMsg('Error communicating with proxy route (Backend may be offline)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            <form className="p-8 bg-zinc-900 rounded-xl shadow-2xl flex flex-col gap-4 w-[400px]">
                <h1 className="text-2xl font-bold">Heatmap Analytics</h1>
                <p className="text-zinc-400 text-sm">Sign in securely to view user attention heatmaps.</p>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="p-3 bg-zinc-800 rounded outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="p-3 bg-zinc-800 rounded outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                />
                <div className="flex gap-3 mt-2">
                    <button onClick={(e) => handleAuth(e, 'login')} disabled={loading} className="flex-1 p-3 bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 rounded font-semibold transition shadow-lg">
                        {loading ? '...' : 'Log In'}
                    </button>
                    <button onClick={(e) => handleAuth(e, 'register')} disabled={loading} className="flex-1 p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded font-semibold transition shadow-lg text-emerald-400 hover:text-emerald-300">
                        {loading ? '...' : 'Register'}
                    </button>
                </div>
                {errorMsg && (
                    <div className="mt-2 p-3 bg-red-950/50 border border-red-500/50 text-red-400 rounded text-sm text-center font-medium animate-pulse">
                        {errorMsg}
                    </div>
                )}
            </form>
        </div>
    );
}
