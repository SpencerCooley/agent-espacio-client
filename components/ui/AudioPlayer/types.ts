export interface AudioPlayerTheme {
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  textColor?: string;
  playButtonColor?: string;
  fontFamily?: string;
}

export interface AudioPlayerProps {
  src: string;
  name?: string;
  theme?: AudioPlayerTheme;
  height?: number;
  barWidth?: number;
  gap?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface WaveformData {
  waveformData: Float32Array;
  duration: number;
  sampleRate: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isDecoding: boolean;
  error: string | null;
}
