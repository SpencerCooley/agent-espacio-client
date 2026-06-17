'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Chip, Button, IconButton } from '@mui/material';
import { Download as DownloadIcon, Close as CloseIcon, Article as ArticleIcon, Map as MapIcon, Movie as MovieIcon, Description as MarkdownIcon, DataObject as JsonIcon } from '@mui/icons-material';
import InlineThumbnail from '../workspace/InlineThumbnail';
import { marked } from 'marked';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AssetViewProps {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  human_readable_size: string;
  is_image: boolean;
  public_magic_id?: string;
  // For preview mode - allows authenticated download URLs
  downloadUrl?: string;
}

export function PublicAssetView({ 
  id, 
  name, 
  mime_type, 
  human_readable_size, 
  is_image, 
  public_magic_id,
  downloadUrl: customDownloadUrl 
}: AssetViewProps) {
  const isImage = is_image;
  const isMarkdown = mime_type === 'text/markdown' || mime_type === 'text/x-markdown';
  const isVideo = mime_type?.startsWith('video/');
  const downloadUrl = customDownloadUrl || `${API_BASE_URL}/public/assets/${public_magic_id || id}/download`;

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
        <Typography variant="h4">{name}</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={downloadUrl}
          download={name}
        >
          Download
        </Button>
      </Box>

      {isImage ? (
        <Box
          component="img"
          src={downloadUrl}
          alt={name}
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
          <Typography variant="body1">{mime_type}</Typography>
          <Typography variant="body2" color="text.secondary">
            Size: {human_readable_size}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

interface NoteViewProps {
  content: any;
  // If true, use authenticated asset URLs instead of public URLs
  isPreview?: boolean;
}

export function NotePublicView({ content, isPreview }: NoteViewProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!content) {
      setHtml('<p>Empty note</p>');
      return;
    }

    const nodes = content.content || [];
    const rendered = nodes.map((node: any) => renderNode(node, isPreview)).join('');
    setHtml(rendered);
  }, [content, isPreview]);

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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderNode(node: any, isPreview?: boolean): string {
  if (!node) return '';

  const type = node.type;
  const attrs = node.attrs || {};
  const content = node.content || [];
  const marks = node.marks || [];

  let inner = '';
  if (content && Array.isArray(content)) {
    inner = content.map((child: any) => renderNode(child, isPreview)).join('');
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
      const assetMatch = src.match(/\/assets\/([a-f0-9-]+)\/download/);
      if (assetMatch) {
        const assetId = assetMatch[1];
        if (isPreview) {
          src = `${API_BASE_URL}/assets/${assetId}/download`;
        } else {
          src = `${API_BASE_URL}/public/assets/${assetId}/download`;
        }
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

interface MapViewProps {
  content: any;
  name?: string;
  description?: string;
  // For preview mode - use authenticated URLs
  isPreview?: boolean;
}

function getFeatureColor(feature: any): string {
  return feature?.properties?.style?.color || '#1976d2';
}

function getFeatureFillOpacity(feature: any): number {
  return feature?.properties?.style?.fillOpacity ?? 0.3;
}

function getFeatureStrokeWidth(feature: any): number {
  return feature?.properties?.style?.strokeWidth ?? 2;
}

export function MapPublicView({ content, name, description, isPreview }: MapViewProps) {
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

    const geojson = content?.geojson;
    if (geojson && geojson.features && geojson.features.length > 0) {
      const points = geojson.features.filter((f: any) => f.geometry?.type === 'Point');
      const linesAndPolygons = geojson.features.filter(
        (f: any) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString' || f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );

      map.once('style.load', () => {
        points.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const color = getFeatureColor(feature);
          const el = document.createElement('div');
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([coords[0], coords[1]])
            .addTo(map);

          el.addEventListener('mouseenter', () => {
            setTooltip({
              visible: true,
              x: 0,
              y: 0,
              name: feature.properties?.name || 'Point',
              description: feature.properties?.description || '',
            });
            if (cursorRef.current !== 'pointer') {
              map.getCanvas().style.cursor = 'pointer';
              cursorRef.current = 'pointer';
            }
            setHoveredFeatureId(feature.id);
          });

          el.addEventListener('mouseleave', () => {
            setTooltip(prev => ({ ...prev, visible: false }));
            if (cursorRef.current !== 'default') {
              map.getCanvas().style.cursor = '';
              cursorRef.current = 'default';
            }
            setHoveredFeatureId(null);
          });

          el.addEventListener('click', () => {
            const props = feature.properties;
            const rawAssociations = props?.associations;
            const associations: Association[] = rawAssociations
              ? (typeof rawAssociations === 'string' ? JSON.parse(rawAssociations) : rawAssociations)
              : [];
            if (associations.length > 0) {
              setAssociationPanel({
                open: true,
                featureName: feature.properties?.name || 'Point',
                associations,
              });
            }
          });
        });

        linesAndPolygons.forEach((feature: any) => {
          const id = `feature-${feature.id || Math.random().toString(36).substr(2, 9)}`;
          const sourceId = `${id}-source`;

          map.addSource(sourceId, {
            type: 'geojson',
            data: feature,
          });

          const geometryType = feature.geometry?.type;
          const color = getFeatureColor(feature);
          const fillOpacity = getFeatureFillOpacity(feature);
          const strokeWidth = getFeatureStrokeWidth(feature);

          if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            map.addLayer({
              id: `${id}-fill`,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': color,
                'fill-opacity': fillOpacity,
              },
            });

            map.addLayer({
              id: `${id}-outline`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': strokeWidth,
              },
            });
          } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            map.addLayer({
              id: `${id}-line`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': strokeWidth,
              },
            });
          }

          map.on('mousemove', `${id}-fill`, (e) => {
            if (e.features && e.features.length > 0) {
              const f = e.features[0];
              setTooltip({
                visible: true,
                x: e.point.x,
                y: e.point.y,
                name: f.properties?.name || (geometryType === 'Polygon' ? 'Polygon' : 'Line'),
                description: f.properties?.description || '',
              });
              if (cursorRef.current !== 'pointer') {
                map.getCanvas().style.cursor = 'pointer';
                cursorRef.current = 'pointer';
              }
              setHoveredFeatureId(id);
            }
          });

          map.on('mouseleave', `${id}-fill`, () => {
            setTooltip(prev => ({ ...prev, visible: false }));
            if (cursorRef.current !== 'default') {
              map.getCanvas().style.cursor = '';
              cursorRef.current = 'default';
            }
            setHoveredFeatureId(null);
          });

          map.on('click', `${id}-fill`, (e) => {
            if (e.features && e.features.length > 0) {
              const f = e.features[0];
              const props = f.properties;
              const rawAssociations = props?.associations;
              const associations: Association[] = rawAssociations
                ? (typeof rawAssociations === 'string' ? JSON.parse(rawAssociations) : rawAssociations)
                : [];
              if (associations.length > 0) {
                setAssociationPanel({
                  open: true,
                  featureName: f.properties?.name || (geometryType === 'Polygon' ? 'Polygon' : 'Line'),
                  associations,
                });
              }
            }
          });
        });
      });
    }

    return () => {
      map.remove();
    };
  }, [content, viewport, style]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Box ref={mapContainerRef} sx={{ height: '100%', width: '100%' }} />
      
      {/* Name and description card */}
      {(name || description) && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: 1,
            px: 2,
            py: 1,
            boxShadow: 2,
            maxWidth: 400,
          }}
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
                  const url = isPreview 
                    ? (assoc.type === 'asset' ? `/workspace/assets/${assoc.id}` : `/workspace/artifacts/${assoc.id}`)
                    : `/public/view/${assoc.public_magic_id || assoc.id}`;
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
                    variant={isPreview ? 'workspace' : 'public'}
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
                        <ArticleIcon fontSize="large" />
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
