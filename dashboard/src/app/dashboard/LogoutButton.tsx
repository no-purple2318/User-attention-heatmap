"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-md"
        >
            <LogOut size={15} />
            <span>Logout</span>
        </button>
    );
}
