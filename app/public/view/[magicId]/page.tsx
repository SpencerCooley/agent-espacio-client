'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Grid, Paper, Breadcrumbs, Link, Chip, Button, IconButton } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, Download as DownloadIcon, Movie as MovieIcon, Close as CloseIcon, Image as ImageIcon, Article as ArticleIcon, Map as MapIcon, Description as MarkdownIcon, DataObject as JsonIcon } from '@mui/icons-material';
import InlineThumbnail from '../../../../components/workspace/InlineThumbnail';
import { marked } from 'marked';
import { ThemeProvider as MUIThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import {
  hackerBuzzTheme, hackerBuzzDarkTheme,
  midnightGlowTheme, midnightGlowDarkTheme,
  playfulCandyTheme, playfulCandyDarkTheme,
  luxeartTheme, luxeartDarkTheme,
  retroGamifyTheme, retroGamifyDarkTheme,
  scientificAcademiaTheme, scientificAcademiaDarkTheme,
  mintCreamTheme, mintCreamDarkTheme,
} from '../../../../themes';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import WorkflowPublicView from '../../../../components/workspace/WorkflowPublicView';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PublicItem {
  kind: string;
  id: string;
  name: string;
  type?: string;
  mime_type?: string;
  is_image?: boolean;
  is_public?: boolean;
  public_magic_id?: string;
  created_at: string;
  updated_at: string;
}

interface AncestorItem {
  id: string;
  name: string;
  is_public: boolean;
  public_magic_id: string | null;
}

interface PublicViewData {
  kind: string;
  folder?: {
    id: string;
    name: string;
    path: string;
    parent_id: string | null;
    is_public: boolean;
    public_magic_id: string;
  };
  asset?: {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    human_readable_size: string;
    is_image: boolean;
    public_magic_id: string;
  };
  artifact?: {
    id: string;
    name: string;
    type: string;
    description?: string;
    content: any;
    public_magic_id: string;
  };
  ancestors?: AncestorItem[];
  items?: PublicItem[];
  total_items?: number;
  public_theme?: {
    name: string;
    mode: 'light' | 'dark';
  };
}

const themeMap: Record<string, { light: ThemeOptions; dark: ThemeOptions }> = {
  hackerBuzz: { light: hackerBuzzTheme, dark: hackerBuzzDarkTheme },
  midnightGlow: { light: midnightGlowTheme, dark: midnightGlowDarkTheme },
  playfulCandy: { light: playfulCandyTheme, dark: playfulCandyDarkTheme },
  luxeart: { light: luxeartTheme, dark: luxeartDarkTheme },
  retroGamify: { light: retroGamifyTheme, dark: retroGamifyDarkTheme },
  scientificAcademia: { light: scientificAcademiaTheme, dark: scientificAcademiaDarkTheme },
  mintCream: { light: mintCreamTheme, dark: mintCreamDarkTheme },
};

function PublicAssetView({ asset }: { asset: NonNullable<PublicViewData['asset']> }) {
  const isImage = asset.is_image;
  const isMarkdown = asset.mime_type === 'text/markdown' || asset.mime_type === 'text/x-markdown';
  const isVideo = asset.mime_type?.startsWith('video/');
  const downloadUrl = `${API_BASE_URL}/public/assets/${asset.public_magic_id || asset.id}/download`;

  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);

  useEffect(() => {
    if (isMarkdown) {
      setLoadingMarkdown(true);
      fetch(downloadUrl)
        .then((res) => res.text())
        .then((text) => {
          setMarkdownContent(text);
        })
        .catch(() => {
          setMarkdownContent(null);
        })
        .finally(() => {
          setLoadingMarkdown(false);
        });
    }
  }, [isMarkdown, downloadUrl]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{asset.name}</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={downloadUrl}
          download={asset.name}
        >
          Download
        </Button>
      </Box>

      {isImage ? (
        <Box
          component="img"
          src={downloadUrl}
          alt={asset.name}
          sx={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 2, display: 'block', mx: 'auto' }}
        />
      ) : isVideo ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            component="video"
            controls
            loop
            autoPlay
            muted
            preload="metadata"
            src={downloadUrl}
            sx={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 2, display: 'block' }}
          />
        </Box>
      ) : isMarkdown ? (
        <Paper sx={{ p: 4 }}>
          {loadingMarkdown ? (
            <Typography color="text.secondary">Loading markdown...</Typography>
          ) : markdownContent !== null ? (
            <Box
              className="public-markdown"
              sx={{
                '& h1': { fontSize: '2em', fontWeight: 700, mb: 2, mt: 3 },
                '& h2': { fontSize: '1.5em', fontWeight: 600, mb: 2, mt: 3 },
                '& h3': { fontSize: '1.25em', fontWeight: 600, mb: 1, mt: 2 },
                '& p': { mb: 1.5, lineHeight: 1.6 },
                '& ul, & ol': { mb: 1.5, pl: 3 },
                '& li': { mb: 0.5 },
                '& blockquote': { borderLeft: '3px solid #ccc', pl: 2, ml: 0, color: 'text.secondary' },
                '& code': { bgcolor: 'rgba(0,0,0,0.05)', px: 0.5, borderRadius: 1, fontFamily: 'monospace' },
                '& pre': { bgcolor: 'rgba(0,0,0,0.05)', p: 2, borderRadius: 2, overflow: 'auto' },
                '& img': { maxWidth: '100%', borderRadius: 1 },
                '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
                '& th, & td': { border: '1px solid #ddd', p: 1, textAlign: 'left' },
                '& th': { bgcolor: 'rgba(0,0,0,0.05)', fontWeight: 600 },
              }}
              dangerouslySetInnerHTML={{ __html: marked.parse(markdownContent) as string }}
            />
          ) : (
            <Typography color="text.secondary">Failed to load markdown content</Typography>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">{asset.mime_type}</Typography>
          <Typography variant="body2" color="text.secondary">
            Size: {asset.human_readable_size}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default function PublicViewPage() {
  const params = useParams();
  const magicId = params.magicId as string;
  const [data, setData] = useState<PublicViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!magicId) return;

    const fetchPublicView = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/view/${magicId}`);
        if (!response.ok) {
          throw new Error('Public item not found');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load public view');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicView();
  }, [magicId]);

  // Build public theme from server response
  const publicThemeName = data?.public_theme?.name || 'hackerBuzz';
  const publicThemeMode = data?.public_theme?.mode || 'dark';
  const themeOptions = themeMap[publicThemeName]?.[publicThemeMode] || themeMap['hackerBuzz']['dark'];
  const publicTheme = createTheme(themeOptions);

  const content = () => {
    if (loading) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (!data) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Item not found</Typography>
        </Box>
      );
    }

    // Render folder view
    if (data.kind === 'folder' && data.folder) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Typography color="text.primary">My Drive</Typography>
          {(data.ancestors || [])
            .filter((ancestor) => ancestor.name !== 'My Drive')
            .map((ancestor) => (
              <Link
                key={ancestor.id}
                href={`/public/view/${ancestor.public_magic_id || ancestor.id}`}
                underline="hover"
                color="inherit"
              >
                {ancestor.name}
              </Link>
            ))}
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            {data.folder.name}
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" sx={{ mb: 3 }}>
          {data.folder.name}
        </Typography>

        <Grid container spacing={2}>
          {data.items?.map((item) => {
            const viewId = item.public_magic_id || item.id;
            const extMatch = item.name.match(/\.([a-zA-Z0-9]+)$/);
            const extension = extMatch ? extMatch[1].toLowerCase() : null;
            const isImage = item.kind === 'asset' && item.is_image;
            const isVideo = item.kind === 'asset' && item.mime_type?.startsWith('video/');
            const thumbnailUrl = isImage
              ? `${API_BASE_URL}/public/assets/${item.id}/download`
              : null;
            const videoThumbnailUrl = isVideo
              ? `${API_BASE_URL}/public/assets/${item.id}/download`
              : null;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Paper
                  sx={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                  onClick={() => {
                    window.location.href = `/public/view/${viewId}`;
                  }}
                >
                  {thumbnailUrl && (
                    <Box
                      component="img"
                      src={thumbnailUrl}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        display: 'block',
                        bgcolor: 'grey.100',
                      }}
                    />
                  )}
                  {isVideo && videoThumbnailUrl && (
                    <Box
                      component="video"
                      src={videoThumbnailUrl}
                      muted
                      preload="metadata"
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        display: 'block',
                        bgcolor: 'grey.100',
                      }}
                    />
                  )}
                  <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {item.kind === 'folder' && <FolderIcon color="primary" fontSize="small" />}
                      {item.kind === 'asset' && isVideo && <MovieIcon fontSize="small" />}
                      {item.kind === 'asset' && !isImage && !isVideo && <FileIcon fontSize="small" />}
                      {item.kind === 'artifact' && <FileIcon color="secondary" fontSize="small" />}
                      <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto' }}>
                      <Chip size="small" label={item.kind} />
                      {item.type && <Chip size="small" label={item.type} />}
                      {isVideo && <Chip size="small" label="video" />}
                      {extension && <Chip size="small" label={`.${extension}`} />}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {data.items?.length === 0 && (
          <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
            This folder is empty
          </Typography>
        )}
      </Box>
    );
  }

  // Render asset view
  if (data.kind === 'asset' && data.asset) {
    return <PublicAssetView asset={data.asset} />;
  }

  // Render artifact view (note)
  if (data.kind === 'artifact' && data.artifact) {
    const artifact = data.artifact;

    // Workflow artifacts render full page (no container)
    if (artifact.type === 'workflow' && artifact.content) {
      return (
        <WorkflowPublicView
          content={artifact.content}
          name={artifact.name}
          description={artifact.description}
        />
      );
    }

    // Map artifacts render full page (no container)
    if (artifact.type === 'map' && artifact.content) {
      return (
        <MapPublicView
          content={artifact.content}
          name={artifact.name}
          description={artifact.description}
        />
      );
    }

    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {artifact.name}
        </Typography>

        {artifact.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {artifact.description}
          </Typography>
        )}

        <Paper sx={{ p: 3 }}>
          {artifact.type === 'note' && artifact.content ? (
            <NotePublicView content={artifact.content} />
          ) : (
            <Typography color="text.secondary">
              Public view for artifact type "{artifact.type}" is not yet implemented.
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Unknown item type</Typography>
      </Box>
    );
  };

  return (
    <MUIThemeProvider theme={publicTheme}>
      <Box
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh',
        }}
      >
        {content()}
      </Box>
    </MUIThemeProvider>
  );
}

// Simple note renderer for public view
function NotePublicView({ content }: { content: any }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!content) {
      setHtml('<p>Empty note</p>');
      return;
    }

    // TipTap content structure: { type: "doc", content: [...], linked_asset_ids: [...] }
    const nodes = content.content || [];
    const rendered = nodes.map((node: any) => renderNode(node)).join('');
    setHtml(rendered);
  }, [content]);

  // Post-process: fix taskItems so checkbox and content are on the same line
  // TipTap wraps taskItem content in a paragraph, which is block-level
  const processedHtml = html;

  return (
    <Box
      className="public-note-content"
      sx={{
        '& h1': { fontSize: '2em', fontWeight: 700, mb: 2, mt: 3 },
        '& h2': { fontSize: '1.5em', fontWeight: 600, mb: 2, mt: 3 },
        '& h3': { fontSize: '1.25em', fontWeight: 600, mb: 1, mt: 2 },
        '& p': { mb: 1.5, lineHeight: 1.6 },
        '& ul, & ol': { mb: 1.5, pl: 3 },
        '& li': { mb: 0.5 },
        '& blockquote': { borderLeft: '3px solid #ccc', pl: 2, ml: 0, color: 'text.secondary' },
        '& code': { bgcolor: 'rgba(0,0,0,0.05)', px: 0.5, borderRadius: 1, fontFamily: 'monospace' },
        '& pre': { bgcolor: 'rgba(0,0,0,0.05)', p: 2, borderRadius: 2, overflow: 'auto' },
        '& img': { maxWidth: '100%', borderRadius: 1 },
        '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
        '& th, & td': { border: '1px solid #ddd', p: 1, textAlign: 'left' },
        '& th': { bgcolor: 'rgba(0,0,0,0.05)', fontWeight: 600 },
      }}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

function renderNode(node: any): string {
  if (!node) return '';

  const type = node.type;
  const attrs = node.attrs || {};
  const content = node.content || [];
  const marks = node.marks || [];

  let inner = '';
  if (content && Array.isArray(content)) {
    inner = content.map((child: any) => renderNode(child)).join('');
  }

  switch (type) {
    case 'doc':
      return inner;
    case 'paragraph':
      const pAlign = attrs.textAlign ? `text-align: ${attrs.textAlign};` : '';
      return pAlign ? `<p style="${pAlign}">${inner}</p>` : `<p>${inner}</p>`;
    case 'heading':
      const level = attrs.level || 1;
      const hAlign = attrs.textAlign ? `text-align: ${attrs.textAlign};` : '';
      return hAlign ? `<h${level} style="${hAlign}">${inner}</h${level}>` : `<h${level}>${inner}</h${level}>`;
    case 'text':
      let text = escapeHtml(node.text || '');
      if (marks && Array.isArray(marks)) {
        // Collect inline styles from textStyle/highlight
        let inlineStyles: string[] = [];
        
        marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'link':
              const href = mark.attrs?.href || '#';
              text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
              break;
            case 'textStyle':
              if (mark.attrs?.color) {
                inlineStyles.push(`color: ${mark.attrs.color}`);
              }
              break;
            case 'highlight':
              if (mark.attrs?.color) {
                inlineStyles.push(`background-color: ${mark.attrs.color}`);
                inlineStyles.push('padding: 2px 6px');
                inlineStyles.push('border-radius: 4px');
              }
              break;
          }
        });
        
        // Apply collected inline styles
        if (inlineStyles.length > 0) {
          text = `<span style="${inlineStyles.join('; ')};">${text}</span>`;
        }
      }
      return text;
    case 'bulletList':
      return `<ul>${inner}</ul>`;
    case 'orderedList':
      return `<ol>${inner}</ol>`;
    case 'listItem':
      return `<li>${inner}</li>`;
    case 'taskList':
      return `<ul style="list-style: none; padding-left: 0; margin: 0;">${inner}</ul>`;
    case 'taskItem':
      const checked = attrs.checked ? '☑' : '☐';
      // taskItem inner is a paragraph (<p>), strip <p> wrapper to keep checkbox inline
      const cleanInner = inner.replace(/^<p>/, '').replace(/<\/p>$/, '');
      return `<li style="margin-bottom: 4px; list-style: none; display: flex; align-items: baseline; gap: 0.5em;"><span style="display: inline-block; width: 1.5em; user-select: none; flex-shrink: 0;">${checked}</span><span style="flex: 1;">${cleanInner}</span></li>`;
    case 'codeBlock':
      const lang = attrs.language || '';
      return `<pre><code class="language-${lang}">${inner}</code></pre>`;
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    case 'image':
      let src = attrs.src || '';
      const alt = escapeHtml(attrs.alt || '');
      // Convert asset download URLs to public download URLs
      // Handle both relative (/assets/...) and absolute (http://.../assets/...) URLs
      const assetMatch = src.match(/\/assets\/([a-f0-9-]+)\/download/);
      if (assetMatch) {
        const assetId = assetMatch[1];
        // Use full API URL since frontend and API may be on different ports
        src = `${API_BASE_URL}/public/assets/${assetId}/download`;
      }
      return `<img src="${src}" alt="${alt}" style="max-width: 100%; display: block; margin: 8px auto;" />`;
    case 'table':
      return `<table>${inner}</table>`;
    case 'tableRow':
      return `<tr>${inner}</tr>`;
    case 'tableCell':
      return `<td>${inner}</td>`;
    case 'tableHeader':
      return `<th>${inner}</th>`;
    default:
      return inner;
  }
}

// Full-page map renderer for public view
function getFeatureColor(feature: any): string {
  return feature?.properties?.style?.color || '#1976d2';
}

function getFeatureFillOpacity(feature: any): number {
  return feature?.properties?.style?.fillOpacity ?? 0.3;
}

function getFeatureStrokeWidth(feature: any): number {
  return feature?.properties?.style?.strokeWidth ?? 2;
}

interface Association {
  type: 'artifact' | 'asset';
  id: string;
  name: string;
  kind?: string;
  mime_type?: string;
  is_image?: boolean;
  public_magic_id?: string | null;
}

function MapPublicView({ content, name, description }: { content: any; name?: string; description?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    name: string;
    description: string;
  }>({ visible: false, x: 0, y: 0, name: '', description: '' });
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [associationPanel, setAssociationPanel] = useState<{
    open: boolean;
    featureName: string;
    associations: Association[];
  }>({ open: false, featureName: '', associations: [] });
  const cursorRef = useRef<'default' | 'pointer'>('default');

  const viewport = content?.viewport || {
    latitude: 20,
    longitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  };
  const style = content?.style || 'carto-voyager';

  const CARTO_VOYAGER_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
  const CARTO_DARK_MATTER_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const GOOGLE_SATELLITE_STYLE = {
    version: 8 as const,
    sources: {
      satellite: {
        type: 'raster' as const,
        tiles: [
          'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: 'Imagery © Google',
        maxzoom: 22,
      },
    },
    layers: [
      { id: 'satellite', type: 'raster' as const, source: 'satellite', minzoom: 0, maxzoom: 22 },
    ],
  };

  const OSM_STYLE = {
    version: 8 as const,
    sources: {
      osm: {
        type: 'raster' as const,
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
        maxzoom: 19,
      },
    },
    layers: [
      { id: 'osm', type: 'raster' as const, source: 'osm', minzoom: 0, maxzoom: 19 },
    ],
  };

  function getStyleUrl(mapStyle: string) {
    switch (mapStyle) {
      case 'google-satellite':
        return GOOGLE_SATELLITE_STYLE;
      case 'dark-matter':
        return CARTO_DARK_MATTER_URL;
      case 'osm':
        return OSM_STYLE;
      case 'carto-voyager':
      default:
        return CARTO_VOYAGER_URL;
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(style),
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Add GeoJSON layer after style loads
    const geojson = content?.geojson;
    if (geojson && geojson.features && geojson.features.length > 0) {
      const points = geojson.features.filter((f: any) => f.geometry?.type === 'Point');
      const linesAndPolygons = geojson.features.filter(
        (f: any) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString' || f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );

      map.once('style.load', () => {
        // Add markers for points
        points.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const color = getFeatureColor(feature);
          const el = document.createElement('div');
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.backgroundColor = color;
          el.style.borderRadius = '50%';
          el.style.border = '3px solid #fff';
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);

          const props = feature.properties || {};
          const featureName = props.name || 'Unnamed';
          const featureDescription = props.description || '';
          const associations = props.associations
            ? (typeof props.associations === 'string' ? JSON.parse(props.associations) : props.associations)
            : [];

          // Hover tooltip
          el.addEventListener('mouseenter', (e) => {
            const rect = el.getBoundingClientRect();
            const mapRect = mapContainerRef.current?.getBoundingClientRect();
            if (mapRect) {
              setTooltip({
                visible: true,
                x: rect.left - mapRect.left + rect.width / 2 + 16,
                y: rect.top - mapRect.top - 16,
                name: featureName,
                description: featureDescription,
              });
            }
            if (associations.length > 0) {
              cursorRef.current = 'pointer';
              map.getCanvas().style.cursor = 'pointer';
            }
          });

          el.addEventListener('mouseleave', () => {
            setTooltip((prev) => ({ ...prev, visible: false }));
            if (cursorRef.current !== 'default') {
              cursorRef.current = 'default';
              map.getCanvas().style.cursor = 'default';
            }
          });

          // Click -> navigate associations
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (associations.length === 1) {
              const assoc = associations[0];
              const url = `/public/view/${assoc.public_magic_id || assoc.id}`;
              window.open(url, '_blank');
            } else if (associations.length > 1) {
              setAssociationPanel({
                open: true,
                featureName,
                associations,
              });
            }
          });
        });

        // Add source for lines and polygons
        if (linesAndPolygons.length > 0) {
          map.addSource('geojson-features', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: linesAndPolygons,
            },
          });

          // Line layer (also matches MultiLineString)
          map.addLayer({
            id: 'geojson-lines',
            type: 'line',
            source: 'geojson-features',
            filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
            paint: {
              'line-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
              'line-width': ['coalesce', ['get', 'strokeWidth', ['get', 'style']], 3],
            },
          });

          // Polygon fill layer (also matches MultiPolygon)
          map.addLayer({
            id: 'geojson-polygons-fill',
            type: 'fill',
            source: 'geojson-features',
            filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            paint: {
              'fill-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
              'fill-opacity': ['coalesce', ['get', 'fillOpacity', ['get', 'style']], 0.3],
            },
          });

          // Polygon outline layer (also matches MultiPolygon)
          map.addLayer({
            id: 'geojson-polygons-outline',
            type: 'line',
            source: 'geojson-features',
            filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            paint: {
              'line-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
              'line-width': ['coalesce', ['get', 'strokeWidth', ['get', 'style']], 2],
            },
          });

          // Hover interactions
          const layerIds = ['geojson-lines', 'geojson-polygons-fill', 'geojson-polygons-outline'];
          
          map.on('mousemove', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
            if (features.length > 0) {
              const feature = features[0];
              const props = feature.properties || {};
              const featureName = props.name || 'Unnamed';
              const featureDescription = props.description || '';
              const featureId = feature.id || '';
              const associations = props.associations
                ? (typeof props.associations === 'string' ? JSON.parse(props.associations) : props.associations)
                : [];
              
              setTooltip({
                visible: true,
                x: e.point.x + 16,
                y: e.point.y - 16,
                name: featureName,
                description: featureDescription,
              });
              setHoveredFeatureId(featureId ? String(featureId) : null);
              
              if (associations.length > 0 && cursorRef.current !== 'pointer') {
                cursorRef.current = 'pointer';
                map.getCanvas().style.cursor = 'pointer';
              }
            } else {
              setTooltip((prev) => ({ ...prev, visible: false }));
              setHoveredFeatureId(null);
              if (cursorRef.current !== 'default') {
                cursorRef.current = 'default';
                map.getCanvas().style.cursor = 'default';
              }
            }
          });

          map.on('mouseleave', () => {
            setTooltip((prev) => ({ ...prev, visible: false }));
            setHoveredFeatureId(null);
            if (cursorRef.current !== 'default') {
              cursorRef.current = 'default';
              map.getCanvas().style.cursor = 'default';
            }
          });

          map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
            if (features.length > 0) {
              const feature = features[0];
              const props = feature.properties || {};
              const featureName = props.name || 'Unnamed';
              const associations = props.associations
                ? (typeof props.associations === 'string' ? JSON.parse(props.associations) : props.associations)
                : [];
              
              if (associations.length === 1) {
                const assoc = associations[0];
                const url = `/public/view/${assoc.public_magic_id || assoc.id}`;
                window.open(url, '_blank');
              } else if (associations.length > 1) {
                setAssociationPanel({
                  open: true,
                  featureName,
                  associations,
                });
              }
            }
          });
        }
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Box
        ref={mapContainerRef}
        sx={{ position: 'absolute', inset: 0 }}
      />
      {/* Optional: overlay name and description at top-left */}
      {(name || description) && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.9)',
            borderRadius: 1,
            px: 2,
            py: 1,
            boxShadow: 2,
            maxWidth: 400,
            color: theme.palette.text.primary,
          })}
        >
          {name && (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
              {name}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {description}
            </Typography>
          )}
        </Box>
      )}

      {/* Hover tooltip */}
      {tooltip.visible && (
        <Box
          sx={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1001,
            bgcolor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            borderRadius: 1,
            px: 1.5,
            py: 1,
            boxShadow: 3,
            maxWidth: 280,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: tooltip.description ? 0.5 : 0 }}>
            {tooltip.name}
          </Typography>
          {tooltip.description && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
              {tooltip.description}
            </Typography>
          )}
        </Box>
      )}

      {/* Association panel */}
      {associationPanel.open && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 320,
            zIndex: 1002,
            bgcolor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {associationPanel.featureName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {associationPanel.associations.length} linked items
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setAssociationPanel({ open: false, featureName: '', associations: [] })}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Association list */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {associationPanel.associations.map((assoc: Association) => (
              <Box
                key={assoc.id}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 1.5,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 2, borderColor: 'primary.main' },
                }}
                onClick={() => {
                  const url = `/public/view/${assoc.public_magic_id || assoc.id}`;
                  window.open(url, '_blank');
                }}
              >
                {/* Thumbnail / Icon */}
                <Box sx={{ width: 120, height: 90, flexShrink: 0, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InlineThumbnail
                    type={assoc.type}
                    id={assoc.id}
                    kind={assoc.kind}
                    is_image={assoc.is_image}
                    public_magic_id={assoc.public_magic_id}
                    variant="public"
                    size={120}
                  />
                  {(assoc.type === 'artifact' || (!assoc.is_image && !assoc.kind?.includes('image') && !assoc.kind?.includes('video'))) && (
                    <Box sx={{ color: 'text.secondary', fontSize: 40 }}>
                      {assoc.type === 'artifact' ? (
                        assoc.kind === 'note' ? <ArticleIcon fontSize="large" /> :
                        assoc.kind === 'map' ? <MapIcon fontSize="large" /> :
                        <ArticleIcon fontSize="large" />
                      ) : (
                        assoc.kind?.includes('video') ? <MovieIcon fontSize="large" /> :
                        assoc.kind?.includes('markdown') ? <MarkdownIcon fontSize="large" /> :
                        assoc.kind?.includes('json') ? <JsonIcon fontSize="large" /> :
                        <FileIcon fontSize="large" />
                      )}
                    </Box>
                  )}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, py: 1, pr: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {assoc.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={assoc.type} size="small" color={assoc.type === 'artifact' ? 'primary' : 'secondary'} sx={{ fontSize: '0.7rem', height: 22 }} />
                    {assoc.kind && (
                      <Chip label={assoc.kind} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
