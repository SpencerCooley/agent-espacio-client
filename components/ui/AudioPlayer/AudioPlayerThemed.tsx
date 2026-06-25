import { useTheme } from '@mui/material/styles';
import AudioPlayer from './AudioPlayer';
import { AudioPlayerProps } from './types';

export default function AudioPlayerThemed(props: Omit<AudioPlayerProps, 'theme'>) {
  const theme = useTheme();
  return (
    <AudioPlayer
      {...props}
      theme={{
        barColor: theme.palette.text.secondary as string,
        progressColor: theme.palette.primary.main as string,
        backgroundColor: theme.palette.background.paper as string,
        textColor: theme.palette.text.primary as string,
        playButtonColor: theme.palette.primary.main as string,
        fontFamily: (theme.typography.fontFamily as string) || 'system-ui, sans-serif',
      }}
    />
  );
}
