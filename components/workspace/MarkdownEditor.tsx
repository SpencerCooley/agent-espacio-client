'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { marked } from 'marked';
import TurndownService from 'turndown';

interface MarkdownEditorProps {
  content: string;
  onSave: (content: string) => Promise<void>;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

turndownService.addRule('table', {
  filter: 'table',
  replacement: function (content, node) {
    const rows = node.querySelectorAll('tr');
    const output: string[] = [];

    rows.forEach((row, rowIdx) => {
      const cells = row.querySelectorAll('th, td');
      const cellTexts: string[] = [];
      cells.forEach((cell) => {
        let text = (cell as HTMLElement).textContent || '';
        text = text.trim();
        cellTexts.push(text);
      });
      output.push('| ' + cellTexts.join(' | ') + ' |');

      if (rowIdx === 0 && row.querySelector('th')) {
        output.push('|' + cellTexts.map(() => '---').join(' | ') + '|');
      }
    });

    return '\n\n' + output.join('\n') + '\n\n';
  },
});

type EditorMode = 'wysiwyg' | 'source';

export default function MarkdownEditor({ content: initialContent, onSave }: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>('wysiwyg');
  const [markdown, setMarkdown] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (!isUpdatingRef.current) {
        const html = ed.getHTML();
        const md = turndownService.turndown(html);
        setMarkdown(md);
      }
    },
    onCreate: ({ editor: ed }) => {
      const html = marked.parse(initialContent) as string;
      isUpdatingRef.current = true;
      ed.commands.setContent(html);
      isUpdatingRef.current = false;
      setEditorReady(true);
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleModeChange = (_: any, newMode: EditorMode | null) => {
    if (!newMode || !editor) return;

    if (newMode === 'source' && mode === 'wysiwyg') {
      const html = editor.getHTML();
      const md = turndownService.turndown(html);
      setMarkdown(md);
    }

    if (newMode === 'wysiwyg' && mode === 'source') {
      isUpdatingRef.current = true;
      const html = marked.parse(markdown) as string;
      editor.commands.setContent(html);
      isUpdatingRef.current = false;
    }

    setMode(newMode);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  const handleSave = useCallback(async () => {
    let finalContent = markdown;
    if (mode === 'wysiwyg' && editor) {
      const html = editor.getHTML();
      finalContent = turndownService.turndown(html);
    }
    setSaving(true);
    try {
      await onSave(finalContent);
    } finally {
      setSaving(false);
    }
  }, [markdown, mode, editor, onSave]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="wysiwyg" sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
            Visual
          </ToggleButton>
          <ToggleButton value="source" sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
            Source
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        <Box
          component="button"
          onClick={handleSave}
          disabled={saving}
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 1,
            border: 'none',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
            '&:hover': { opacity: 0.9 },
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {mode === 'wysiwyg' ? (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              '& .ProseMirror': {
                outline: 'none',
                minHeight: '100%',
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
                  py: 1,
                  textAlign: 'left',
                },
                '& th': {
                  fontWeight: 600,
                  bgcolor: 'action.selected',
                },
                '& tr:nth-of-type(even)': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        ) : (
          <TextField
            multiline
            fullWidth
            value={markdown}
            onChange={handleSourceChange}
            variant="standard"
            sx={{
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'flex-start',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                p: 2,
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
              },
              '& .MuiInput-underline:before, & .MuiInput-underline:after': {
                display: 'none',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
