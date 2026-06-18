'use client';

import { Box, Typography, Chip, IconButton } from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  Article as ArticleIcon,
  Map as MapIcon,
  Description as MarkdownIcon,
  DataObject as JsonIcon,
  OpenInNew as OpenIcon,
  Public as PublicIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useAuthImage } from '../../hooks/useAuthImage';
import { getAssetDownloadUrl } from '../../services/assets';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Association {
  type: 'artifact' | 'asset';
  id: string;
  name: string;
  kind?: string;
  mime_type?: string;
  is_image?: boolean;
  public_magic_id?: string | null;
}

interface AssociationMediaCardProps {
  association: Association;
  variant: 'editor' | 'public';
  onClick?: () => void;
}

function getKindIcon(kind?: string) {
  const lowerKind = kind?.toLowerCase() || '';
  if (lowerKind.includes('image') || lowerKind.includes('jpg') || lowerKind.includes('png')) return <ImageIcon fontSize="small" />;
  if (lowerKind.includes('video') || lowerKind.includes('mp4')) return <MovieIcon fontSize="small" />;
  if (lowerKind.includes('markdown') || lowerKind.includes('md')) return <MarkdownIcon fontSize="small" />;
  if (lowerKind.includes('json')) return <JsonIcon fontSize="small" />;
  if (lowerKind.includes('map')) return <MapIcon fontSize="small" />;
  if (lowerKind.includes('note')) return <ArticleIcon fontSize="small" />;
  return <FileIcon fontSize="small" />;
}

function getKindColor(kind?: string) {
  const lowerKind = kind?.toLowerCase() || '';
  if (lowerKind.includes('image') || lowerKind.includes('jpg') || lowerKind.includes('png')) return 'info';
  if (lowerKind.includes('video') || lowerKind.includes('mp4')) return 'secondary';
  if (lowerKind.includes('markdown') || lowerKind.includes('md')) return 'success';
  if (lowerKind.includes('json')) return 'warning';
  if (lowerKind.includes('map')) return 'primary';
  if (lowerKind.includes('note')) return 'default';
  return 'default';
}

function getKindLabel(kind?: string, mime_type?: string) {
  if (kind) return kind;
  if (mime_type) return mime_type.split('/')[1]?.toUpperCase() || 'File';
  return 'File';
}

export default function AssociationMediaCard({ association, variant, onClick }: AssociationMediaCardProps) {
  const isAsset = association.type === 'asset';
  const isImage = isAsset && (association.is_image || association.kind?.toLowerCase().includes('image'));
  const isVideo = isAsset && (association.kind?.toLowerCase().includes('video') || association.mime_type?.startsWith('video/'));
  const isMedia = isImage || isVideo;

  // Editor: use authenticated thumbnail URLs for both images and videos
  const editorThumbUrl = isMedia ? getAssetDownloadUrl(association.id, 256) : null;
  const editorThumbSrc = useAuthImage(editorThumbUrl);

  // Public: use public thumbnail URLs for both images and videos
  const publicThumbUrl = isMedia
    ? `${API_BASE_URL}/public/assets/${association.public_magic_id || association.id}/download?size=256`
    : null;

  const thumbSrc = variant === 'editor' ? editorThumbSrc : publicThumbUrl;

  const workspaceUrl = isAsset
    ? `/workspace/assets/${association.id}`
    : `/workspace/artifacts/${association.id}`;
  const publicUrl = `/public/view/${association.public_magic_id || association.id}`;

  const handleClick = () => {
    if (onClick) onClick();
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(workspaceUrl, '_blank');
  };

  const handlePublicView = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(publicUrl, '_blank');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
      }}
      onClick={handleClick}
    >
      {/* Media Preview */}
      {isMedia && thumbSrc ? (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', bgcolor: 'grey.100' }}>
          <Box
            component="img"
            src={thumbSrc}
            alt={association.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isVideo && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
              }}
            >
              <PlayIcon sx={{ color: '#fff', fontSize: 40, opacity: 0.9 }} />
            </Box>
          )}
        </Box>
      ) : (
        /* Non-Media Preview */
        <Box
          sx={{
            width: '100%',
            aspectRatio: '4/3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            gap: 1,
          }}
        >
          <Box sx={{ color: 'text.secondary', fontSize: 40 }}>
            {getKindIcon(association.kind)}
          </Box>
          <Chip
            size="small"
            label={getKindLabel(association.kind, association.mime_type)}
            color={getKindColor(association.kind) as any}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      )}

      {/* Info Bar */}
      <Box
        sx={{
          p: 1,
          background: (theme) =>
            isMedia
              ? `linear-gradient(to top, ${theme.palette.common.black} 0%, transparent 100%)`
              : 'background.paper',
          position: isMedia ? 'absolute' : 'relative',
          bottom: isMedia ? 0 : 'auto',
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isMedia ? '#fff' : 'text.primary',
          }}
        >
          {association.name}
        </Typography>
        {association.kind && (
          <Typography
            variant="caption"
            sx={{
              color: isMedia ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              fontSize: '0.65rem',
            }}
          >
            {association.kind}
          </Typography>
        )}
      </Box>

      {/* Action Buttons (Editor only) */}
      {variant === 'editor' && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            display: 'flex',
            gap: 0.5,
            zIndex: 2,
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiBox-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <IconButton
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              p: 0.5,
              width: 28,
              height: 28,
            }}
            onClick={handleOpen}
          >
            <OpenIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              p: 0.5,
              width: 28,
              height: 28,
            }}
            onClick={handlePublicView}
          >
            <PublicIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
