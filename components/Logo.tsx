'use client';

import { useTheme } from '@mui/material/styles';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

export default function Logo({ width = 120, height = 40 }: LogoProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <div style={{ 
      filter: isDarkMode ? 'invert(1)' : 'none',
      transition: 'filter 0.2s ease-in-out'
    }}>
      <Image
        src="/logo/agent-espacio-logo.svg"
        alt="Agent Espacio"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
