'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotesIcon from '@mui/icons-material/Notes';
import ArticleIcon from '@mui/icons-material/Article';
import MapIcon from '@mui/icons-material/Map';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';
import MovieIcon from '@mui/icons-material/Movie';
import { artifactService, Artifact } from '../../services/artifacts';
import { assetService, Asset } from '../../services/assets';

interface AssociationExplorerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { type: 'artifact' | 'asset'; id: string; name: string; kind?: string; mime_type?: string; is_image?: boolean; public_magic_id?: string | null }) => void;
}

interface ExplorerItem {
  type: 'artifact' | 'asset';
  id: string;
  name: string;
  kind?: string;
  mime_type?: string;
  is_image?: boolean;
  public_magic_id?: string | null;
}

export default function AssociationExplorer({ open, onClose, onSelect }: AssociationExplorerProps) {
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    Promise.all([
      artifactService.listArtifacts(),
      assetService.listAssets(),
    ])
      .then(([artifactsRes, assetsRes]) => {
        const artifacts: ExplorerItem[] = (artifactsRes.artifacts || []).map((a: Artifact) => ({
          type: 'artifact',
          id: a.id,
          name: a.name,
          kind: a.type,
        }));

        const assets: ExplorerItem[] = (assetsRes.assets || []).map((a: Asset) => ({
          type: 'asset',
          id: a.id,
          name: a.name,
          kind: a.mime_type?.split('/')[0] || 'file',
          mime_type: a.mime_type,
          is_image: a.is_image,
          public_magic_id: a.public_magic_id,
        }));

        setItems([...artifacts, ...assets]);
      })
      .catch(() => {
        setError('Failed to load items');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find((i) => i.id === selectedId);

  const getIcon = (item: ExplorerItem) => {
    if (item.type === 'artifact') {
      switch (item.kind) {
        case 'note': return <NotesIcon fontSize="small" />;
        case 'map': return <MapIcon fontSize="small" />;
        case 'workflow': return <AccountTreeIcon fontSize="small" />;
        default: return <ArticleIcon fontSize="small" />;
      }
    }
    // asset
    if (item.mime_type?.startsWith('image/')) return <InsertDriveFileIcon fontSize="small" />;
    if (item.mime_type?.startsWith('video/')) return <MovieIcon fontSize="small" />;
    if (item.mime_type === 'text/markdown' || item.mime_type === 'text/x-markdown') return <DescriptionIcon fontSize="small" />;
    if (item.mime_type === 'application/json') return <DataObjectIcon fontSize="small" />;
    return <InsertDriveFileIcon fontSize="small" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select an Item</DialogTitle>
      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search assets and artifacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Content */}
        {loading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">No items found</Typography>
          </Box>
        ) : (
            <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selectedId === item.id}
                  onClick={() => setSelectedId(item.id)}
                  sx={{
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIcon(item)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Chip label={item.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                        {item.kind && (
                          <Chip label={item.kind} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                        )}
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedItem}
          onClick={() => {
            if (selectedItem) {
              onSelect({
                type: selectedItem.type as 'artifact' | 'asset',
                id: selectedItem.id,
                name: selectedItem.name,
                kind: selectedItem.kind,
                mime_type: selectedItem.mime_type,
                is_image: selectedItem.is_image,
                public_magic_id: selectedItem.public_magic_id,
              });
              onClose();
            }
          }}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
}
