import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

/**
 * Shared typography styling for rendered markdown (via `marked` +
 * dangerouslySetInnerHTML). Used by the public asset view and the
 * composer markdown card so both render identically.
 */
export const markdownContentSx: SystemStyleObject<Theme> = {
  '& h1': { fontSize: '2em', fontWeight: 700, mb: 2, mt: 3 },
  '& h2': { fontSize: '1.5em', fontWeight: 600, mb: 2, mt: 3 },
  '& h3': { fontSize: '1.25em', fontWeight: 600, mb: 1, mt: 2 },
  '& p': { mb: 1.5, lineHeight: 1.6 },
  '& ul, & ol': { mb: 1.5, pl: 3 },
  '& li': { mb: 0.5 },
  '& blockquote': { borderLeft: '3px solid #ccc', pl: 2, ml: 0, color: 'text.secondary' },
  '& code': { bgcolor: 'rgba(0,0,0,0.05)', px: 0.5, borderRadius: 1, fontFamily: 'monospace' },
  '& pre': { bgcolor: 'rgba(0,0,0,0.05)', p: 2, borderRadius: 2, overflow: 'auto' },
  '& img': (theme: Theme) => ({
    width: '100%',
    borderRadius: 1,
    [theme.breakpoints.up('md')]: {
      width: '80%',
    },
  }),
  '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
  '& th, & td': { border: '1px solid #ddd', p: 1, textAlign: 'left' },
  '& th': { bgcolor: 'rgba(0,0,0,0.05)', fontWeight: 600 },
  '& a': { color: 'info.main', textDecoration: 'underline', cursor: 'pointer' },
  '& a:hover': { color: 'info.dark' },
};
