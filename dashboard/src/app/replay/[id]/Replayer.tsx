"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function Replayer({ session, events }: { session: any, events: any[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Normalization boundaries
    const firstEventTime = events.length > 0 ? events[0].timestamp : 0;
    const lastEventTime = events.length > 0 ? events[events.length - 1].timestamp : 0;
    const duration = lastEventTime - firstEventTime;

    useEffect(() => {
        // Initial draw
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const resizeCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            // taking off approx 100px for the control bar
            canvasRef.current.height = window.innerHeight - 100;
            drawFrame();
        }
    };

    const drawFrame = (currentTimeOffset = playheadRef.current) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        // Draw backdrop to look like a browser window container
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, w, h);

        // Find all events up to the current playback time
        const targetTime = firstEventTime + currentTimeOffset;

        let currentMouse = null;
        let currentEye = null;

        // To prevent drawing *everything* we just look at the most recent events before targetTime
        for (let i = 0; i < events.length; i++) {
            if (events[i].timestamp > targetTime) break;
            if (events[i].type === 'MOUSE') currentMouse = events[i];
            if (events[i].type === 'EYE') currentEye = events[i];
            // Note: Scroll isn't easily visualized without the underlying DOM, 
            // but it's captured in the DB for future heatmap rendering.
        }

        // Draw Mouse Cursor
        if (currentMouse) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.beginPath();
            // Mouse is saved as normalized 0-1
            ctx.arc(currentMouse.x * w, currentMouse.y * h, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw Eye Gaze Point (Heatmap dot)
        if (currentEye) {
            ctx.fillStyle = "rgba(37, 99, 235, 0.5)"; // Blue tinted
            ctx.beginPath();
            // MediaPipe coords are usually normalized 0-1
            ctx.arc(currentEye.x * w, currentEye.y * h, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const loop = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp - playheadRef.current;

        const elapsed = timestamp - startTimeRef.current;

        if (elapsed >= duration) {
            // Reached end
            setIsPlaying(false);
            playheadRef.current = duration;
            drawFrame(duration);
            return;
        }

        playheadRef.current = elapsed;
        drawFrame(elapsed);
        animationRef.current = requestAnimationFrame(loop);
    };

    const togglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            startTimeRef.current = null;
        } else {
            if (playheadRef.current >= duration) {
                playheadRef.current = 0; // restart
            }
            setIsPlaying(true);
            animationRef.current = requestAnimationFrame(loop);
        }
    };

    const restart = () => {
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        startTimeRef.current = null;
        playheadRef.current = 0;
        drawFrame(0);
    };

    if (events.length === 0) {
        return <div className="p-8 text-center bg-gray-50 flex-1">This session has no recorded events.</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-[#0f172a] overflow-hidden">
            {/* Canvas Area (Mocking the webpage) */}
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="absolute inset-0 bg-white" />
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-sm shadow-xl">
                    Target URL: <span className="text-blue-300 ml-1">{session.url}</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="h-[100px] bg-[#1e293b] border-t border-slate-700 flex items-center justify-between px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        {isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                    </button>

                    <button
                        onClick={restart}
                        className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-all active:scale-95"
                        title="Restart Replay"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

                <div className="flex-1 mx-8 flex flex-col gap-2">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-75 relative rounded-full"
                            style={{ width: `${duration === 0 ? 0 : (playheadRef.current / duration) * 100}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white shadow-[0_0_10px_white] rounded-full blur-[1px]"></div>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 font-medium tracking-wider uppercase flex justify-between">
                        <span>Time: {(playheadRef.current / 1000).toFixed(1)}s</span>
                        <span>Total: {(duration / 1000).toFixed(1)}s</span>
                    </div>
                </div>

                <div className="text-slate-400 text-sm flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-black border border-white"></div> Mouse</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500/50"></div> Eye Gaze</div>
                </div>
            </div>
        </div>
    );
}
