'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Grid, Paper, Breadcrumbs, Link, Chip, Button } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, Download as DownloadIcon, Movie as MovieIcon } from '@mui/icons-material';
import { marked } from 'marked';

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
}

function PublicAssetView({ asset }: { asset: NonNullable<PublicViewData['asset']> }) {
  const isImage = asset.is_image;
  const isMarkdown = asset.mime_type === 'text/markdown' || asset.mime_type === 'text/x-markdown';
  const isVideo = asset.mime_type?.startsWith('video/');
  const downloadUrl = `http://localhost:8000/public/assets/${asset.public_magic_id || asset.id}/download`;

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
        const response = await fetch(`http://localhost:8000/public/view/${magicId}`);
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
              ? `http://localhost:8000/public/assets/${item.id}/download`
              : null;
            const videoThumbnailUrl = isVideo
              ? `http://localhost:8000/public/assets/${item.id}/download`
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
        const apiUrl = 'http://localhost:8000';
        src = `${apiUrl}/public/assets/${assetId}/download`;
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
    .replace(/"/g, '&quot;');
}
