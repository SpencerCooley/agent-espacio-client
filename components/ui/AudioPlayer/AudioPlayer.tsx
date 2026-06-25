'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AudioPlayerProps, AudioPlayerTheme, WaveformData } from './types';
import { formatTime, hexToRgb } from './utils';
import './AudioPlayer.css';

const defaultTheme: AudioPlayerTheme = {
  barColor: '#64748b',
  progressColor: '#3b82f6',
  backgroundColor: '#0f172a',
  textColor: '#f8fafc',
  playButtonColor: '#3b82f6',
  fontFamily: 'system-ui, sans-serif',
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polygon points="8,5 8,19 19,12" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

const WAVEFORM_RESOLUTION = 4096;

async function decodeAudioAndExtractWaveform(arrayBuffer: ArrayBuffer): Promise<WaveformData> {
  const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const numChannels = audioBuffer.numberOfChannels;
  const sampleCount = audioBuffer.length;
  const samplesPerPixel = Math.floor(sampleCount / WAVEFORM_RESOLUTION);
  const waveformData = new Float32Array(WAVEFORM_RESOLUTION);
  for (let i = 0; i < WAVEFORM_RESOLUTION; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, sampleCount);
    let peak = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let j = start; j < end; j++) {
        peak = Math.max(peak, Math.abs(channelData[j]));
      }
    }
    waveformData[i] = peak;
  }
  await audioContext.close();
  return {
    waveformData,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}

export default function AudioPlayer({ src, name, theme: themeProp, height = 160, barWidth = 2, gap = 1, onReady, onError }: AudioPlayerProps) {
  const theme = useMemo(() => ({ ...defaultTheme, ...themeProp }), [themeProp]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const waveformRef = useRef<WaveformData | null>(null);
  const hoverXRef = useRef<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize canvas size from container (immediate on mount, debounced for resize)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    let isFirst = true;

    const applySize = () => {
      const wrap = canvasWrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(256, Math.floor(rect.width * dpr));
      canvas.width = width;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;
      isFirst = false;
    };

    const updateSize = () => {
      if (isFirst) {
        applySize();
      } else {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applySize, 300);
      }
    };

    applySize();
    const ro = new ResizeObserver(updateSize);
    if (canvasWrapRef.current) ro.observe(canvasWrapRef.current);
    return () => {
      ro.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [height]);

  // Fetch and decode audio
  useEffect(() => {
    if (!src) return;
    setIsLoading(true);
    setIsDecoding(false);
    setError(null);

    const audio = audioRef.current;
    if (audio) {
      audio.src = src;
      audio.load();
    }

    let cancelled = false;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch audio');
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (cancelled) return;
        setIsDecoding(true);
        return decodeAudioAndExtractWaveform(arrayBuffer);
      })
      .then((data) => {
        if (cancelled || !data) return;
        waveformRef.current = data;
        setDuration(data.duration);
        setIsLoading(false);
        setIsDecoding(false);
        onReady?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setIsLoading(false);
        onError?.(err);
      });

    return () => {
      cancelled = true;
      waveformRef.current = null;
    };
  }, [src, onReady, onError]);

  // Render loop (Canvas 2D)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const barColor = theme.barColor || defaultTheme.barColor!;
    const progressColor = theme.progressColor || defaultTheme.progressColor!;
    const hoverColor = theme.progressColor || defaultTheme.progressColor!;
    const bgColor = theme.backgroundColor || defaultTheme.backgroundColor!;

    const render = () => {
      const audio = audioRef.current;
      const waveform = waveformRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const progress = audio && audio.duration ? audio.currentTime / audio.duration : 0;

      // Clear canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      if (!waveform) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const data = waveform.waveformData;
      const totalBarWidth = (barWidth + gap) * dpr;
      const bars = Math.floor(w / totalBarWidth);
      const barW = barWidth * dpr;
      const barG = gap * dpr;
      const centerY = h / 2;
      const maxBarH = h * 0.45;
      const hoverX = hoverXRef.current;

      for (let i = 0; i < bars; i++) {
        const barX = i * totalBarWidth;
        const sampleIdx = Math.floor((i / bars) * data.length);
        const amplitude = data[sampleIdx];
        const barH = amplitude * maxBarH;
        const barRight = (barX + barW) / w;
        const isProgress = barRight <= progress;
        const isHover = hoverX >= 0 && Math.abs(barRight - hoverX) < 1 / w;

        // Determine color
        ctx.fillStyle = isHover ? hoverColor : isProgress ? progressColor : barColor;

        // Draw top bar (mirrored)
        if (barH > 0) {
          const r = Math.min(2 * dpr, barW / 2);
          ctx.beginPath();
          ctx.roundRect(barX, centerY - barH, barW, barH, [r, r, 0, 0]);
          ctx.fill();

          // Draw bottom bar (mirrored)
          ctx.beginPath();
          ctx.roundRect(barX, centerY, barW, barH, [0, 0, r, r]);
          ctx.fill();
        }
      }

      // Draw thin playhead line
      if (progress > 0) {
        ctx.strokeStyle = progressColor;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        const px = progress * w;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }

      // Draw hover line
      if (hoverX >= 0) {
        ctx.strokeStyle = hoverColor;
        ctx.lineWidth = 1 * dpr;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        const hx = hoverX * w;
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, h);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [height, barWidth, gap, theme]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isFinite(duration)) {
        setDuration(audio.duration);
      }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) audio.pause();
          else audio.play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  }, [isPlaying]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = canvasWrapRef.current;
    const audio = audioRef.current;
    if (!wrap || !audio || !duration) return;
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    audio.currentTime = x * duration;
  }, [duration]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    hoverXRef.current = (e.clientX - rect.left) / rect.width;
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    hoverXRef.current = -1;
  }, []);

  if (error) {
    return (
      <div className="audio-player__error" style={{ fontFamily: theme.fontFamily }}>
        {error}
      </div>
    );
  }

  return (
    <div
      className="audio-player"
      style={{
        '--ap-font-family': theme.fontFamily,
        '--ap-bg-color': theme.backgroundColor,
        '--ap-text-color': theme.textColor,
        '--ap-bar-color': theme.barColor,
        '--ap-progress-color': theme.progressColor,
        '--ap-play-btn-color': theme.playButtonColor,
      } as React.CSSProperties}
    >
      <div className="audio-player__controls">
        <button
          className="audio-player__play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="audio-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {name && <div className="audio-player__name" title={name}>{name}</div>}
      </div>

      <div
        ref={canvasWrapRef}
        className="audio-player__canvas-wrap"
        style={{ height: `${height}px` }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      >
        <canvas ref={canvasRef} />
        {(isLoading || isDecoding) && (
          <div className="audio-player__loading">
            <div className="audio-player__loading-bar" />
          </div>
        )}
      </div>

      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
    </div>
  );
}
