'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  Menu,
  MenuItem,
  TextField,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  Description as DescriptionIcon,
  DataObject as DataObjectIcon,
  InsertDriveFile as FileIcon,
  Notes as NotesIcon,
  Public as PublicIcon,
  OpenInNew as OpenIcon,
  DriveFileRenameOutline as RenameIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { FolderItem } from '../../services/folders';

interface FolderItemCardProps {
  item: FolderItem;
  onDelete: (item: FolderItem) => void;
  onRename?: (item: FolderItem, newName: string) => Promise<void>;
  onMoveItem?: (draggedItem: FolderItem, targetFolderId: string) => Promise<void>;
  onUploadToFolder?: (folderId: string, files: FileList) => Promise<void>;
}

/**
 * FolderItemCard - Displays a single folder item (folder, asset, or artifact)
 * as a card with an appropriate icon.
 *
 * Supports:
 * - Click to open/navigate
 * - Right-click context menu (Open, Rename [folders only], Delete)
 * - Inline rename for folders
 * - Drag to move items between folders
 * - Drop files onto folder cards to upload into them
 */
export default function FolderItemCard({
  item,
  onDelete,
  onRename,
  onMoveItem,
  onUploadToFolder,
}: FolderItemCardProps) {
  const router = useRouter();
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Drag state for folders (drop targets)
  const [isDragOver, setIsDragOver] = useState(false);
  // Red flash for invalid drops (e.g., dropping folder onto itself)
  const [invalidFlash, setInvalidFlash] = useState(false);

  // Auto-focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = () => {
    if (isRenaming) return;
    if (item.kind === 'folder') {
      router.push(`/workspace/folders/${item.id}`);
    } else if (item.kind === 'asset') {
      router.push(`/workspace/assets/${item.id}`);
    } else if (item.kind === 'artifact') {
      router.push(`/workspace/artifacts/${item.id}`);
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleOpen = () => {
    handleCloseContextMenu();
    handleClick();
  };

  const handleStartRename = () => {
    handleCloseContextMenu();
    if (item.kind === 'folder' && onRename) {
      setRenameValue(item.name);
      setIsRenaming(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (renameValue.trim() && renameValue !== item.name && onRename) {
      try {
        await onRename(item, renameValue.trim());
      } catch {
        // Error handled by parent, revert name
        setRenameValue(item.name);
      }
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(item.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDelete = () => {
    handleCloseContextMenu();
    onDelete(item);
  };

  // ── Drag handlers ──

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  // ── Drop handlers (folders only) ──

  const isValidDropTarget = (draggedItem: FolderItem): boolean => {
    if (item.kind !== 'folder') return false;
    // Can't drop a folder onto itself
    if (draggedItem.kind === 'folder' && draggedItem.id === item.id) return false;
    return true;
  };

  const triggerInvalidFlash = () => {
    setInvalidFlash(true);
    setTimeout(() => setInvalidFlash(false), 400);
  };

  // Counter for nested drag enter/leave inside the card
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.kind !== 'folder') return;

    dragCounterRef.current += 1;

    // Check if dragged item is valid for this folder
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const draggedItem = JSON.parse(data) as FolderItem;
        if (!isValidDropTarget(draggedItem)) {
          triggerInvalidFlash();
          return;
        }
      } catch {
        // External file drag - always valid for folders
      }
    }

    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.kind !== 'folder') return;

    // Allow drop
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const draggedItem = JSON.parse(data) as FolderItem;
        if (!isValidDropTarget(draggedItem)) {
          e.dataTransfer.dropEffect = 'none';
          return;
        }
      } catch {
        // External file
      }
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.kind !== 'folder') return;

    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (item.kind !== 'folder') return;

    // External file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onUploadToFolder) {
        await onUploadToFolder(item.id, e.dataTransfer.files);
      }
      return;
    }

    // Internal item drop
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const draggedItem = JSON.parse(data) as FolderItem;
      if (!isValidDropTarget(draggedItem)) {
        triggerInvalidFlash();
        return;
      }
      if (onMoveItem) {
        await onMoveItem(draggedItem, item.id);
      }
    } catch {
      // Ignore parse errors
    }
  };

  const getIcon = () => {
    if (item.kind === 'folder') {
      return <FolderIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
    }

    if (item.kind === 'artifact') {
      switch (item.type) {
        case 'note':
          return <NotesIcon sx={{ fontSize: 48, color: 'secondary.main' }} />;
        case 'map':
          return <PublicIcon sx={{ fontSize: 48, color: 'secondary.main' }} />;
        default:
          return <ArticleIcon sx={{ fontSize: 48, color: 'secondary.main' }} />;
      }
    }

    if (item.kind === 'asset') {
      if (item.is_image) {
        return <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
      }
      if (item.mime_type === 'text/markdown' || item.mime_type === 'text/x-markdown') {
        return <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
      }
      if (item.mime_type === 'application/json') {
        return <DataObjectIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
      }
      return <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
    }

    return <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
  };

  const getKindLabel = () => {
    if (item.kind === 'folder') return 'Folder';
    if (item.kind === 'artifact') return item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Artifact';
    return item.mime_type ? item.mime_type.split('/')[1]?.toUpperCase() : 'File';
  };

  const isFolder = item.kind === 'folder';

  return (
    <>
      <Card
        draggable
        onDragStart={handleDragStart}
        onDragEnter={isFolder ? handleDragEnter : undefined}
        onDragOver={isFolder ? handleDragOver : undefined}
        onDragLeave={isFolder ? handleDragLeave : undefined}
        onDrop={isFolder ? handleDrop : undefined}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.15s ease, box-shadow 0.2s ease, border-color 0.15s ease, background-color 0.2s ease',
          border: '1px solid',
          borderColor: invalidFlash
            ? 'error.main'
            : isDragOver && isFolder
              ? 'primary.main'
              : 'divider',
          ...(isDragOver && isFolder && {
            boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}40, 0 4px 12px ${theme.palette.primary.main}30`,
            bgcolor: 'action.selected',
            transform: 'scale(1.02)',
          }),
          ...(invalidFlash && {
            animation: 'invalidDropFlash 0.4s ease',
          }),
          '@keyframes invalidDropFlash': {
            '0%': { borderColor: 'error.main', boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.3)' },
            '50%': { borderColor: 'error.dark', boxShadow: '0 0 0 4px rgba(244, 67, 54, 0.4)' },
            '100%': { borderColor: 'divider', boxShadow: 'none' },
          },
          '&:hover': {
            transform: isDragOver && isFolder ? 'scale(1.02)' : 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
        onContextMenu={handleContextMenu}
      >
        <CardActionArea
          onClick={handleClick}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            ...(isRenaming && { pointerEvents: 'none' }),
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            {getIcon()}
          </Box>
          <CardContent sx={{ pt: 0, pb: 1, textAlign: 'center', width: '100%' }}>
            {isRenaming ? (
              <TextField
                inputRef={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                size="small"
                fullWidth
                autoFocus
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 0.5,
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.name}
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Chip
                label={getKindLabel()}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleOpen}>
          <ListItemIcon>
            <OpenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>

        {item.kind === 'folder' && onRename && (
          <MenuItem onClick={handleStartRename}>
            <ListItemIcon>
              <RenameIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
