"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Loader2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { useBlobUrl } from '@/hooks/use-blob-urls';

export const VoiceMessagePlayer = React.memo(({ message, zip, isVisible }: { message: Message, zip: JSZip | null, isVisible: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const { url: audioSrc, loading } = useBlobUrl(zip, message.audio_files?.[0]?.uri, isVisible);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            }
        };

        const updateProgress = () => setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
        const handleEnded = () => { setIsPlaying(false); setProgress(0); };

        if (audio.readyState >= 1) {
            setAudioData();
        }

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioSrc]);

    const formatDuration = (d: number) => {
        if (!d || !isFinite(d) || d < 0) return '0:00';
        const minutes = Math.floor(d / 60);
        const seconds = Math.floor(d % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const waveformBars = useMemo(() => {
        const bars = [];
        for (let i = 0; i < 28; i++) {
            const height = 30 + (Math.sin(i * 0.8) * Math.cos(i * 1.5) * 35) + 35;
            bars.push(Math.max(20, Math.min(100, height)));
        }
        return bars;
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 w-[220px] px-3 py-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-white/60" />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 w-[240px]">
            <audio ref={audioRef} src={audioSrc || undefined} preload="metadata" />

            <Button
                onClick={togglePlay}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full flex-shrink-0 bg-white hover:bg-white/90 text-black shadow-sm"
                disabled={!audioSrc}
            >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </Button>

            <div
                className="relative flex-1 flex items-center h-7 cursor-pointer gap-[2px]"
                onClick={(e) => {
                    if (!audioRef.current || !duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    audioRef.current.currentTime = percent * duration;
                    setProgress(percent * 100);
                }}
            >
                {waveformBars.map((height, i) => {
                    const barPercent = (i / waveformBars.length) * 100;
                    const isActive = barPercent <= progress;
                    return (
                        <div
                            key={i}
                            style={{ height: `${height}%` }}
                            className={cn(
                                "w-[3px] rounded-full transition-colors duration-100",
                                isActive ? "bg-white" : "bg-white/30"
                            )}
                        />
                    );
                })}
            </div>

            <span className="text-[11px] text-black font-semibold tabular-nums bg-white/90 px-2 py-0.5 rounded-full shadow-sm flex-shrink-0">
                {formatDuration(duration)}
            </span>
        </div>
    );
});
VoiceMessagePlayer.displayName = 'VoiceMessagePlayer';
