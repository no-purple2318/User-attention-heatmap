'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-expect-error simpleheat lacks types
import simpleheat from 'simpleheat';

const CANVAS_W = 1200;
const CANVAS_H = 800;

export default function Replayer({ events }: { events: any[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const heatRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        if (canvasRef.current && !heatRef.current) {
            heatRef.current = simpleheat(canvasRef.current);
            heatRef.current.max(10);
            heatRef.current.radius(30, 20);
        }
    }, []);

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    const resetReplay = useCallback(() => {
        clearTimers();
        setIsPlaying(false);
        setProgress(0);
        if (heatRef.current) {
            heatRef.current.clear();
            heatRef.current.draw();
        }
    }, []);

    const playSession = useCallback(() => {
        if (!events.length || isPlaying) return;

        resetReplay();
        setIsPlaying(true);

        const startTs = new Date(events[0].timestamp).getTime();
        const endTs = new Date(events[events.length - 1].timestamp).getTime();
        const totalDur = Math.max(endTs - startTs, 1);

        events.forEach((ev) => {
            const delay = new Date(ev.timestamp).getTime() - startTs;

            // Determine pixel coordinates — handle both normalised (0..1) and raw pixel values
            const rawX = Number(ev.x);
            const rawY = Number(ev.y);
            const px = rawX <= 1 ? rawX * CANVAS_W : rawX;
            const py = rawY <= 1 ? rawY * CANVAS_H : rawY;

            const t = setTimeout(() => {
                if (heatRef.current) {
                    heatRef.current.add([px, py, 1]);
                    heatRef.current.draw();
                }
                setProgress(Math.min(100, Math.round((delay / totalDur) * 100)));
            }, delay);

            timersRef.current.push(t);
        });

        const finalTimer = setTimeout(() => {
            setIsPlaying(false);
            setProgress(100);
        }, totalDur + 800);
        timersRef.current.push(finalTimer);
    }, [events, isPlaying, resetReplay]);

    // Cleanup on unmount
    useEffect(() => () => clearTimers(), []);

    return (
        <div className="relative w-full h-full">
            {/* Controls overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <button
                    onClick={isPlaying ? resetReplay : playSession}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all shadow-lg border
                        ${isPlaying
                            ? 'bg-red-600/90 border-red-500 hover:bg-red-700 text-white'
                            : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800 text-white backdrop-blur-sm'
                        } disabled:opacity-50`}
                >
                    {isPlaying ? '⏹ Stop' : '▶ Play Heatmap'}
                </button>
                {events.length === 0 && (
                    <span className="text-xs text-red-400 bg-slate-900/80 px-3 py-1.5 rounded-md border border-red-800">
                        No events recorded for this session
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-10">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full block" />
        </div>
    );
}
