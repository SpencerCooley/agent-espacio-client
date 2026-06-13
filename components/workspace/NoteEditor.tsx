'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  TextField,
  Popover,
} from '@mui/material';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import ImageExtension from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ImageIcon from '@mui/icons-material/Image';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import TableChartIcon from '@mui/icons-material/TableChart';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import HighlightIcon from '@mui/icons-material/Highlight';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import { artifactService, Artifact } from '../../services/artifacts';
import { assetService, getAssetDownloadUrl } from '../../services/assets';
import AssetImageNodeView from './AssetImageNodeView';

const TEXT_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'Red', value: '#e53935' },
  { label: 'Orange', value: '#fb8c00' },
  { label: 'Green', value: '#43a047' },
  { label: 'Blue', value: '#1e88e5' },
  { label: 'Purple', value: '#8e24aa' },
  { label: 'Gray', value: '#757575' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#ffeb3b' },
  { label: 'Green', value: '#a5d6a7' },
  { label: 'Blue', value: '#90caf9' },
  { label: 'Red', value: '#ef9a9a' },
  { label: 'Purple', value: '#ce93d8' },
  { label: 'Gray', value: '#e0e0e0' },
];

interface NoteEditorProps {
  artifact: Artifact;
}

function extractLinkedAssetIds(content: Record<string, unknown>): string[] {
  const ids: string[] = [];
  const docContent = (content as any)?.content;
  if (!Array.isArray(docContent)) return ids;

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === 'image' && node.attrs?.['data-asset-id']) {
        const id = node.attrs['data-asset-id'];
        if (!ids.includes(id)) ids.push(id);
      }
      if (Array.isArray(node.content)) {
        walk(node.content);
      }
    }
  };

  walk(docContent);
  return ids;
}

export default function NoteEditor({ artifact }: NoteEditorProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(artifact.name);
  const lastSavedName = useRef(artifact.name);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>('');
  const [heading, setHeading] = useState('0');
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [highlightAnchor, setHighlightAnchor] = useState<null | HTMLElement>(null);
  const saveRef = useRef<(json: Record<string, unknown>) => Promise<void>>(null!);
  const [selectedImage, setSelectedImage] = useState<{
    pos: number;
  } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(
    async (json: Record<string, unknown>) => {
      const jsonStr = JSON.stringify(json);
      if (jsonStr === lastSavedContent.current) return;

      const linked_asset_ids = extractLinkedAssetIds(json);
      const content = { ...json, linked_asset_ids };

      setSaving(true);
      try {
        await artifactService.updateArtifact(artifact.id, { content });
        lastSavedContent.current = jsonStr;
      } catch (err: any) {
        console.error('Failed to save note:', err);
      } finally {
        setSaving(false);
      }
    },
    [artifact.id],
  );

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    nameSaveTimer.current = setTimeout(() => {
      if (newName !== lastSavedName.current) {
        artifactService.updateArtifact(artifact.id, { name: newName })
          .then(() => { lastSavedName.current = newName; })
          .catch((err) => console.error('Failed to save name:', err));
      }
    }, 1500);
  };

  const handleNameBlur = () => {
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    if (name !== lastSavedName.current) {
      artifactService.updateArtifact(artifact.id, { name })
        .then(() => { lastSavedName.current = name; })
        .catch((err) => console.error('Failed to save name:', err));
    }
  };

  saveRef.current = handleSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ImageExtension.extend({
        selectable: true,
        addAttributes() {
          return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
            'data-asset-id': { default: null },
            'data-thumb-size': { default: null },
            textAlign: { default: null },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(AssetImageNodeView);
        },
      }),
    ],
    editorProps: {
      handleKeyDown: (view, event) => {
        const { selection } = view.state;
        if (
          (event.key === 'Backspace' || event.key === 'Delete') &&
          selection instanceof NodeSelection &&
          selection.node.type.name === 'image'
        ) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    content: {},
    onCreate: ({ editor: ed }) => {
      const content = artifact.content;
      if (content && typeof content === 'object') {
        const doc = { ...content } as any;
        delete doc.linked_asset_ids;
        ed.commands.setContent(doc);
        lastSavedContent.current = JSON.stringify(doc);
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => saveRef.current?.(ed.getJSON()), 1500);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { selection } = ed.state;
      if (
        selection instanceof NodeSelection &&
        selection.node.type.name === 'image'
      ) {
        setSelectedImage({ pos: selection.from });
        const coords = ed.view.coordsAtPos(selection.from);
        const editorRect = ed.view.dom.getBoundingClientRect();
        setToolbarPosition({
          top: coords.top - editorRect.top - 44,
          left: coords.left - editorRect.left,
        });
      } else {
        setSelectedImage(null);
      }

      if (ed.isActive('heading')) {
        const attrs = ed.getAttributes('heading');
        setHeading(String(attrs.level || 0));
      } else {
        setHeading('0');
      }
    },
  });

  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom;

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('[data-node-view-wrapper]')) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return;

        const $pos = editor.state.doc.resolve(coords.pos);
        let imagePos: number | null = null;
        if ($pos.nodeAfter?.type.name === 'image') imagePos = coords.pos;
        else if ($pos.nodeBefore?.type.name === 'image') imagePos = coords.pos - 1;

        if (imagePos !== null) {
          editor.view.dispatch(
            editor.state.tr.setSelection(
              NodeSelection.create(editor.state.doc, imagePos),
            ),
          );

          const imgCoords = editor.view.coordsAtPos(imagePos);

          setSelectedImage({ pos: imagePos });
          setToolbarPosition({
            top: imgCoords.top - 44,
            left: imgCoords.left,
          });
        }
      }
    };

    dom.addEventListener('mousedown', handler, true);

    return () => {
      dom.removeEventListener('mousedown', handler, true);
      editor?.destroy();
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editor]);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      try {
        const response = await assetService.uploadAsset(file, artifact.folder_id);
        const asset = response.asset || response;
        const assetId = asset.id;

        editor
          .chain()
          .focus()
          .setImage({
            src: getAssetDownloadUrl(assetId, 512),
            'data-asset-id': assetId,
            'data-thumb-size': 512,
          } as any)
          .run();
      } catch (err: any) {
        console.error('Image upload failed:', err);
      }
    };
    input.click();
  }, [editor, artifact.folder_id]);

  const handleHeadingChange = useCallback(
    (level: number) => {
      if (!editor) return;
      if (level === 0) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level: level as any }).run();
      }
    },
    [editor],
  );

  const handleImageAlign = useCallback(
    (align: string) => {
      if (!editor) return;
      editor.chain().focus().updateAttributes('image', { textAlign: align }).run();
    },
    [editor],
  );

  const handleDeleteImage = useCallback(() => {
    if (!editor) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

    editor.chain().focus().deleteSelection().run();
    saveRef.current?.(editor.getJSON());
  }, [editor]);

  useEffect(() => {
    return () => {
      if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    };
  }, []);

  if (!editor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const inTable = editor.isActive('table');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .task-list-fix ul[data-type="taskList"] {
          list-style: none !important;
          padding-left: 0 !important;
          margin-top: 0;
          margin-bottom: 0;
        }
        .task-list-fix ul[data-type="taskList"] li {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 8px;
        }
        .task-list-fix ul[data-type="taskList"] li > label {
          flex: 0 0 auto !important;
          min-width: 24px;
          cursor: pointer;
          user-select: none;
        }
        .task-list-fix ul[data-type="taskList"] li > label input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
          accent-color: #1976d2;
          margin-top: 2px;
        }
        .task-list-fix ul[data-type="taskList"] li > label span {
          display: none !important;
        }
        .task-list-fix ul[data-type="taskList"] li > div {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
        .task-list-fix ul[data-type="taskList"] li[data-checked="true"] > div p {
          text-decoration: line-through !important;
          opacity: 0.6;
        }
      `}</style>
      <Box className="task-list-fix" sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      <TextField
        variant="outlined"
        size="small"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        onBlur={handleNameBlur}
        placeholder="Untitled"
        sx={{ mb: 1.5 }}
      />
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          py: 0.5,
          mb: 1,
          flexWrap: 'wrap',
        }}
      >
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive('underline') ? 'primary' : 'default'}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Strikethrough">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            color={editor.isActive('strike') ? 'primary' : 'default'}
          >
            <StrikethroughIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Text Color">
          <IconButton
            size="small"
            onClick={(e) => setColorAnchor(e.currentTarget)}
          >
            <FormatColorTextIcon
              fontSize="small"
              sx={{ color: editor.getAttributes('textStyle').color || 'inherit' }}
            />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(colorAnchor)}
          anchorEl={colorAnchor}
          onClose={() => setColorAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper sx={{ p: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
            {TEXT_COLORS.map((c) => (
              <Tooltip key={c.value} title={c.label}>
                <IconButton
                  size="small"
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    setColorAnchor(null);
                  }}
                  sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c.value }}
                />
              </Tooltip>
            ))}
            <Tooltip title="Clear">
              <IconButton
                size="small"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorAnchor(null);
                }}
                sx={{ width: 28, height: 28, borderRadius: '50%' }}
              >
                <FormatClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </Popover>

        <Tooltip title="Highlight">
          <IconButton
            size="small"
            onClick={(e) => setHighlightAnchor(e.currentTarget)}
          >
            <HighlightIcon
              fontSize="small"
              sx={{ color: editor.getAttributes('highlight').color || 'inherit' }}
            />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(highlightAnchor)}
          anchorEl={highlightAnchor}
          onClose={() => setHighlightAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper sx={{ p: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
            {HIGHLIGHT_COLORS.map((c) => (
              <Tooltip key={c.value} title={c.label}>
                <IconButton
                  size="small"
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: c.value }).run();
                    setHighlightAnchor(null);
                  }}
                  sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c.value }}
                />
              </Tooltip>
            ))}
            <Tooltip title="Clear">
              <IconButton
                size="small"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightAnchor(null);
                }}
                sx={{ width: 28, height: 28, borderRadius: '50%' }}
              >
                <FormatClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </Popover>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Select
          size="small"
          value={heading}
          onChange={(e) => handleHeadingChange(Number(e.target.value))}
          sx={{
            minWidth: 100,
            fontSize: '0.8rem',
            '& .MuiSelect-select': { py: 0.5 },
          }}
        >
          <MenuItem value="0">Paragraph</MenuItem>
          <MenuItem value="1">Heading 1</MenuItem>
          <MenuItem value="2">Heading 2</MenuItem>
          <MenuItem value="3">Heading 3</MenuItem>
        </Select>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ordered List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Checklist">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            color={editor.isActive('taskList') ? 'primary' : 'default'}
          >
            <CheckBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Blockquote">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
          >
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            color={editor.isActive('codeBlock') ? 'primary' : 'default'}
          >
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Align Left">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
          >
            <FormatAlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
          >
            <FormatAlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
          >
            <FormatAlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Justify">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            color={editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Insert Image">
          <IconButton size="small" onClick={handleImageUpload}>
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Insert Table">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          >
            <TableChartIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {inTable && (
          <>
            <Tooltip title="Add Row Before">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                <PlaylistAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Row After">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <PlaylistRemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Column Before">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                <ViewWeekIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Column After">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Table">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          {saving ? 'Saving...' : 'Saved'}
        </Typography>

        <Tooltip title="Undo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
          position: 'relative',
        }}
        ref={editorRef}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            '& .ProseMirror': {
              outline: 'none',
              minHeight: '100%',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              '& p': { my: 0.5 },
              '& h1': { fontSize: '1.8rem', fontWeight: 600, mt: 2, mb: 1 },
              '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 0.75 },
              '& h3': { fontSize: '1.25rem', fontWeight: 500, mt: 1.5, mb: 0.5 },
              '& ul, & ol': { pl: 3 },
              '& li': { my: 0.25 },
              '& code': {
                bgcolor: 'action.hover',
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.85em',
              },
              '& pre': {
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                '& code': {
                  bgcolor: 'transparent',
                  p: 0,
                  color: 'inherit',
                },
              },
              '& blockquote': {
                borderLeft: 3,
                borderColor: 'primary.main',
                pl: 2,
                ml: 0,
                color: 'text.secondary',
                fontStyle: 'italic',
              },
              '& a': { color: 'primary.main' },
              '& mark': {
                borderRadius: 0.5,
                padding: '0 2px',
              },
              '& hr': { my: 2 },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                my: 2,
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 1.5,
                textAlign: 'left',
                verticalAlign: 'top',
              },
              '& th': {
                fontWeight: 600,
                bgcolor: 'action.selected',
              },
              '& tr:nth-of-type(even)': {
                bgcolor: 'action.hover',
              },
              '& img': {
                cursor: 'pointer',
              },
              '& .ProseMirror-selectednode img': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                borderRadius: 1,
              },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>

        {selectedImage && (
          <Box
            sx={{
              position: 'fixed',
              top: toolbarPosition.top,
              left: toolbarPosition.left,
              zIndex: 1000,
            }}
          >
            <Paper
              elevation={4}
              onMouseDown={(e) => e.preventDefault()}
              sx={{
                display: 'flex',
                gap: 0.25,
                p: 0.25,
              }}
            >
              <Tooltip title="Align Left">
                <IconButton
                  size="small"
                  onClick={() => handleImageAlign('left')}
                  color={
                    editor.isActive({ textAlign: 'left' })
                      ? 'primary'
                      : 'default'
                  }
                >
                  <FormatAlignLeftIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Align Center">
                <IconButton
                  size="small"
                  onClick={() => handleImageAlign('center')}
                  color={
                    editor.isActive({ textAlign: 'center' })
                      ? 'primary'
                      : 'default'
                  }
                >
                  <FormatAlignCenterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Align Right">
                <IconButton
                  size="small"
                  onClick={() => handleImageAlign('right')}
                  color={
                    editor.isActive({ textAlign: 'right' })
                      ? 'primary'
                      : 'default'
                  }
                >
                  <FormatAlignRightIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
              <Tooltip title="Delete Image">
                <IconButton size="small" onClick={handleDeleteImage} color="error">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>
        )}
      </Paper>
      </Box>
    </Box>
  );
}
