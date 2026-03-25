"use client";

import { useEffect, useRef, useState, useMemo, MouseEvent as ReactMouseEvent } from "react";
import { Play, Pause, RotateCcw, Map, Film, GripHorizontal, Maximize2 } from "lucide-react";
// @ts-expect-error simpleheat does not provide type definitions
import simpleheat from "simpleheat";

export default function Replayer({ session, events }: { session: Record<string, any>, events: Record<string, any>[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [viewMode, setViewMode] = useState<"REPLAY" | "HEATMAP">("REPLAY");
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    // Reactive state to drive progress bar and time label re-renders
    const [playheadPercent, setPlayheadPercent] = useState(0);
    const [playheadSec, setPlayheadSec] = useState(0);

    // Draggable Window State
    const [position, setPosition] = useState({ x: 100, y: 50 });
    const [size, setSize] = useState({ width: 1024, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Heatmap instance reference
    const heatRef = useRef<ReturnType<typeof simpleheat>>(null);

    // Normalization boundaries
    const firstEventTime = events.length > 0 ? events[0].timestamp : 0;
    const lastEventTime = events.length > 0 ? events[events.length - 1].timestamp : 0;
    const duration = lastEventTime - firstEventTime;

    // Timeline Histogram calculation
    const timelineBins = useMemo(() => {
        if (duration === 0) return [];
        const BIN_COUNT = 100;
        const bins = new Array(BIN_COUNT).fill(0);
        events.forEach(ev => {
            const timeOffset = ev.timestamp - firstEventTime;
            const binIdx = Math.min(BIN_COUNT - 1, Math.floor((timeOffset / duration) * BIN_COUNT));
            // Weight EYE events more than MOUSE to make the histogram more interesting
            bins[binIdx] += (ev.type === 'EYE' ? 3 : 1);
        });
        const maxBin = Math.max(...bins, 1);
        return bins.map(val => val / maxBin); // normalized 0 to 1
    }, [events, duration, firstEventTime]);

    // Handle Window Resize (canvas update)
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.width = size.width;
            canvasRef.current.height = size.height - 40; // Subtract title bar height

            // Re-init simpleheat if canvas changes size
            if (viewMode === "HEATMAP") {
                heatRef.current = simpleheat(canvasRef.current);
                drawHeatmap();
            } else {
                drawFrame();
            }
        }
    }, [size, viewMode]);

    // Cleanup animation on unmount or viewMode change
    useEffect(() => {
        if (viewMode === "HEATMAP") {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            setIsPlaying(false);
            if (!heatRef.current && canvasRef.current) {
                heatRef.current = simpleheat(canvasRef.current);
            }
            drawHeatmap();
        } else {
            drawFrame(playheadRef.current);
        }
    }, [viewMode]);

    // --- Drag & Resize Handlers ---
    const handleMouseDownDrag = (e: ReactMouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseDownResize = (e: ReactMouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: Math.max(0, e.clientY - dragOffset.current.y) // Don't drag off top of screen
                });
            } else if (isResizing) {
                setSize(prevSize => ({
                    // Minimum dimensions
                    width: Math.max(400, e.clientX - position.x),
                    height: Math.max(300, e.clientY - position.y)
                }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = 'auto';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, position]);

    // --- Drawing Logic ---
    const drawHeatmap = () => {
        if (!heatRef.current || !canvasRef.current) return;
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        const dataPoints = events
            .filter(ev => ev.type === 'EYE' || ev.type === 'MOUSE')
            .map(ev => {
                const x = ev.x * w;
                const y = ev.y * h;
                const weight = ev.type === 'EYE' ? 1.0 : 0.3; // Eye tracking drops hotter points
                return [x, y, weight];
            });

        heatRef.current.data(dataPoints);
        heatRef.current.max(events.length > 50 ? 5 : 2); // Tune density based on total events
        heatRef.current.radius(35, 25); // Radius and blur
        heatRef.current.draw();
    };

    const drawFrame = (currentTimeOffset = playheadRef.current) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)"; // Barely visible tint over iframe
        ctx.fillRect(0, 0, w, h);

        const targetTime = firstEventTime + currentTimeOffset;
        let currentMouse = null;
        let currentEye = null;

        for (let i = 0; i < events.length; i++) {
            if (events[i].timestamp > targetTime) break;
            if (events[i].type === 'MOUSE') currentMouse = events[i];
            if (events[i].type === 'EYE') currentEye = events[i];
        }

        if (currentMouse) {
            ctx.fillStyle = "rgba(241, 245, 249, 0.9)"; // slate-100
            ctx.beginPath();
            ctx.arc(currentMouse.x * w, currentMouse.y * h, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(51, 65, 85, 0.8)"; // slate-700
            ctx.lineWidth = 2;
            ctx.stroke();

            // Subtle glowing trail
            ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
            ctx.shadowBlur = 10;
        }

        if (currentEye) {
            ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // blue-500 tinted
            ctx.beginPath();
            ctx.arc(currentEye.x * w, currentEye.y * h, 28, 0, Math.PI * 2);
            ctx.fill();

            // Center focal point
            ctx.fillStyle = "rgba(96, 165, 250, 0.8)"; // blue-400
            ctx.beginPath();
            ctx.arc(currentEye.x * w, currentEye.y * h, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0; // Reset shadow
        }
    };

    const loop = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp - playheadRef.current;
        const elapsed = timestamp - startTimeRef.current;

        if (elapsed >= duration) {
            setIsPlaying(false);
            playheadRef.current = duration;
            setPlayheadPercent(100);
            setPlayheadSec(duration / 1000);
            drawFrame(duration);
            return;
        }

        playheadRef.current = elapsed;
        // Update reactive state for progress bar - only every ~4 frames to avoid excessive renders
        const pct = duration > 0 ? (elapsed / duration) * 100 : 0;
        setPlayheadPercent(pct);
        setPlayheadSec(elapsed / 1000);
        drawFrame(elapsed);
        animationRef.current = requestAnimationFrame(loop);
    };

    const togglePlay = () => {
        if (viewMode === "HEATMAP") {
            setViewMode("REPLAY");
            // small timeout to ensure canvas is cleared from heatmap before playing
            setTimeout(() => {
                startPlaying();
            }, 50);
        } else {
            if (isPlaying) {
                setIsPlaying(false);
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                startTimeRef.current = null;
            } else {
                startPlaying();
            }
        }
    };

    const startPlaying = () => {
        if (playheadRef.current >= duration) playheadRef.current = 0;
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(loop);
    };

    const restart = () => {
        setViewMode("REPLAY");
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        startTimeRef.current = null;
        playheadRef.current = 0;
        setPlayheadPercent(0);
        setPlayheadSec(0);
        setTimeout(() => drawFrame(0), 50);
    };

    // Allow scrubbing timeline
    const handleTimelineClick = (e: ReactMouseEvent<HTMLDivElement>) => {
        if (viewMode === "HEATMAP") return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        playheadRef.current = percent * duration;
        setPlayheadPercent(percent * 100);
        setPlayheadSec(playheadRef.current / 1000);
        drawFrame(playheadRef.current);
        if (isPlaying) {
            // reset start time so it resumes from new position smoothly
            startTimeRef.current = performance.now() - playheadRef.current;
        }
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col h-screen bg-[#0f172a] items-center justify-center font-sans p-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
                    <h3 className="text-xl text-slate-300 font-medium mb-2">Empty Session</h3>
                    <p className="text-slate-500">This session has no recorded events to replay.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0f172a] overflow-hidden font-sans relative">
            {/* Background elements for depth */}
            <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Draggable Replayer Window */}
            <div
                className="absolute bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    boxShadow: isDragging ? '0 30px 60px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.5)',
                    transition: isDragging ? 'none' : 'box-shadow 0.3s ease'
                }}
            >
                {/* Title Bar (Draggable Area) */}
                <div
                    className="h-10 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 flex items-center px-4 cursor-grab active:cursor-grabbing shrink-0"
                    onMouseDown={handleMouseDownDrag}
                >
                    <div className="flex gap-2 mr-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <GripHorizontal size={16} className="text-slate-500 mx-auto" />
                    <div className="text-xs text-slate-400 font-medium truncate ml-auto w-48 text-right">
                        {session.url}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative bg-white overflow-hidden">
                    {/* Embedded Website */}
                    <div
                        className={`absolute inset-0 w-full h-full ${viewMode === "HEATMAP" ? "grayscale opacity-30" : "grayscale-[50%] opacity-80"}`}
                        style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }} // Prevent iframe swallowing mouse events
                    >
                        <iframe
                            src={session.url}
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin allow-scripts"
                            title="Target Website"
                        />
                    </div>

                    {/* Overlay Canvas using slate-900/70 for dark heatmap background */}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 z-10 pointer-events-none ${viewMode === "HEATMAP" ? "bg-slate-900/70" : ""}`}
                    />
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 flex items-end justify-end p-1 text-slate-500 opacity-50 hover:opacity-100"
                    onMouseDown={handleMouseDownResize}
                >
                    <Maximize2 size={12} className="rotate-90" />
                </div>
            </div>

            {/* Bottom Global Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 flex items-center justify-center bg-gradient-to-tr from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-full transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] border border-blue-400/20"
                    >
                        {isPlaying ? <Pause size={32} /> : <Play size={32} className="translate-x-1" />}
                    </button>

                    <button
                        onClick={restart}
                        className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all active:scale-95 border border-slate-700 shadow-inner group"
                        title="Restart Replay"
                    >
                        <RotateCcw size={20} className="group-hover:-rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="h-10 w-px bg-slate-800 mx-2"></div>

                    <div className="flex bg-slate-950/50 rounded-xl p-1.5 border border-slate-800 shadow-inner">
                        <button
                            onClick={() => setViewMode("REPLAY")}
                            className={`px-5 py-2.5 flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === "REPLAY" ? "bg-slate-700 text-white shadow-md shadow-black/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                        >
                            <Film size={18} /> Replay
                        </button>
                        <button
                            onClick={() => setViewMode("HEATMAP")}
                            className={`px-5 py-2.5 flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === "HEATMAP" ? "bg-blue-600 text-white shadow-md shadow-blue-900/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                        >
                            <Map size={18} /> Heatmap
                        </button>
                    </div>
                </div>

                <div className="flex-1 mx-12 flex flex-col gap-3">
                    <div
                        className={`h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner group cursor-pointer relative ${viewMode === "HEATMAP" ? "pointer-events-none opacity-50" : ""}`}
                        onClick={handleTimelineClick}
                    >
                        {/* Interactive Timeline Histogram Spikes */}
                        {timelineBins.map((heightPct, idx) => (
                            <div
                                key={idx}
                                className="absolute bottom-0 bg-slate-700/50"
                                style={{
                                    left: `${(idx / timelineBins.length) * 100}%`,
                                    width: `${100 / timelineBins.length}%`,
                                    height: `${heightPct * 100}%`
                                }}
                            />
                        ))}

                        {/* Progress Fill */}
                        <div
                            className={`absolute top-0 bottom-0 left-0 transition-none rounded-full ${viewMode === "HEATMAP" ? "w-full bg-emerald-500/80" : "bg-gradient-to-r from-blue-600/80 to-indigo-500/80"}`}
                            style={{
                                width: viewMode === "HEATMAP" ? "100%" : `${playheadPercent}%`,
                            }}
                        >
                            {viewMode === "REPLAY" && <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white shadow-[0_0_10px_white] rounded-full"></div>}
                        </div>
                    </div>
                    <div className="text-sm font-medium tracking-wide flex justify-between">
                        <span className="text-blue-400">{viewMode === "HEATMAP" ? "Aggregated View" : `Time: ${playheadSec.toFixed(1)}s`}</span>
                        <span className="text-slate-500">Total: {(duration / 1000).toFixed(1)}s</span>
                    </div>
                </div>

                <div className="text-slate-300 text-sm flex items-center gap-8 bg-slate-950/40 px-6 py-3 rounded-2xl border border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3 font-medium">
                        <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-700 shadow-sm"></div> Mouse
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-500/40 border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div> Eye Gaze
                    </div>
                </div>
            </div>
        </div>
    );
}
