"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Loader2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { useBlobUrl } from '@/hooks/use-blob-urls';

type VoiceMessagePlayerProps = {
  message: Message;
  zip: JSZip | null;
  isVisible: boolean;
};

export const VoiceMessagePlayer = React.memo(({ message, zip, isVisible }: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { url: audioSrc, loading } = useBlobUrl(zip, message.audio_files?.[0]?.uri, isVisible);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error('Failed to play voice message:', error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const updateProgress = () => {
      setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    if (audio.readyState >= 1) setAudioData();

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc]);

  useEffect(() => {
    if (!audioSrc && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [audioSrc]);

  const formatDuration = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return minutes + ':' + remaining.toString().padStart(2, '0');
  };

  const waveformBars = useMemo(() => {
    return Array.from({ length: 28 }, (_, index) => {
      const height = 30 + (Math.sin(index * 0.8) * Math.cos(index * 1.5) * 35) + 35;
      return Math.max(20, Math.min(100, height));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 w-[220px] px-3 py-2.5" role="status" aria-label="Loading voice message">
        <Loader2 className="h-5 w-5 animate-spin text-white/60" aria-hidden="true" />
      </div>
    );
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
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />}
      </Button>

      <label className="sr-only" htmlFor={'voice-progress-' + message.id}>Voice message progress</label>
      <input
        id={'voice-progress-' + message.id}
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={progress}
        onChange={(event) => {
          const audio = audioRef.current;
          if (!audio || !duration) return;
          const nextProgress = Number(event.target.value);
          audio.currentTime = (nextProgress / 100) * duration;
          setProgress(nextProgress);
        }}
        className="flex-1 accent-white cursor-pointer"
        aria-label="Voice message progress"
      />

      <span className="text-[11px] text-black font-semibold tabular-nums bg-white/90 px-2 py-0.5 rounded-full shadow-sm flex-shrink-0" aria-label={'Duration ' + formatDuration(duration)}>
        {formatDuration(duration)}
      </span>
    </div>
  );
});
VoiceMessagePlayer.displayName = 'VoiceMessagePlayer';
