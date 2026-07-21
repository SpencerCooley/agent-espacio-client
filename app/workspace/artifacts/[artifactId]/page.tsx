'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
} from '@mui/material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import { artifactService, Artifact } from '../../../../services/artifacts';
import { folderService } from '../../../../services/folders';
import { useShareContext } from '../../../../context/ShareContext';
import dynamic from 'next/dynamic';

const NoteEditor = dynamic(() => import('../../../../components/workspace/NoteEditor'), { ssr: false });
const WorkflowEditor = dynamic(() => import('../../../../components/workspace/WorkflowEditor'), { ssr: false });
const MapEditor = dynamic(() => import('../../../../components/workspace/MapEditor'), { ssr: false });
const GalleryEditor = dynamic(() => import('../../../../components/workspace/GalleryEditor'), { ssr: false });
const ComposerEditor = dynamic(() => import('../../../../components/workspace/ComposerEditor'), { ssr: false });
const ComposerMetaPanel = dynamic(() => import('../../../../components/workspace/ComposerMetaPanel'), { ssr: false });
const RepoViewer = dynamic(() => import('../../../../components/workspace/RepoViewer'), { ssr: false });

function ArtifactViewerContent() {
  const params = useParams();
  const artifactId = params.artifactId as string;
  const { setShareTarget } = useShareContext();

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [ancestors, setAncestors] = useState<{ id: string; name: string; is_public: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Agent Espacio';

  useEffect(() => {
    if (!artifactId) return;

    setLoading(true);
    setError(null);

    artifactService.getArtifact(artifactId)
      .then((response) => {
        setArtifact(response);
        if (response.folder_id) {
          folderService.getFolderAncestors(response.folder_id)
            .then((res) => {
              const chain = res.ancestors
                .filter((f) => !f.is_root)
                .map((f) => ({
                  id: f.id,
                  name: f.name,
                  is_public: f.is_public,
                }));
              setAncestors(chain);

              // Check if any ancestor is public (inherited)
              const hasPublicParent = chain.some((f) => f.is_public);
              const isPublic = response.is_public || hasPublicParent;

              setShareTarget({
                id: response.id,
                type: 'artifact',
                name: response.name,
                isPublic: isPublic,
                publicMagicId: response.public_magic_id,
                isInherited: hasPublicParent,
                isLoading: false,
                onToggle: async () => {
                  if (hasPublicParent) return;
                  setIsShareLoading(true);
                  try {
                    const updated = await artifactService.shareArtifact(artifactId);
                    setArtifact((prev) => (prev ? { ...prev, is_public: updated.is_public, public_magic_id: updated.public_magic_id } : null));
                    setShareTarget((prev) => (prev ? {
                      ...prev,
                      isPublic: updated.is_public,
                      publicMagicId: updated.public_magic_id,
                    } : null));
                    setSuccessMessage(
                      updated.is_public
                        ? 'Artifact is now publicly shared'
                        : 'Artifact is now private'
                    );
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to toggle sharing';
                    setError(message);
                  } finally {
                    setIsShareLoading(false);
                  }
                },
              });
            })
            .catch(() => {
              setAncestors([]);
              setShareTarget({
                id: response.id,
                type: 'artifact',
                name: response.name,
                isPublic: response.is_public,
                publicMagicId: response.public_magic_id,
                isInherited: false,
                isLoading: false,
                onToggle: async () => {
                  setIsShareLoading(true);
                  try {
                    const updated = await artifactService.shareArtifact(artifactId);
                    setArtifact((prev) => (prev ? { ...prev, is_public: updated.is_public, public_magic_id: updated.public_magic_id } : null));
                    setShareTarget((prev) => (prev ? {
                      ...prev,
                      isPublic: updated.is_public,
                      publicMagicId: updated.public_magic_id,
                    } : null));
                    setSuccessMessage(
                      updated.is_public
                        ? 'Artifact is now publicly shared'
                        : 'Artifact is now private'
                    );
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to toggle sharing';
                    setError(message);
                  } finally {
                    setIsShareLoading(false);
                  }
                },
              });
            });
        } else {
          // Root folder - no ancestors
          setShareTarget({
            id: response.id,
            type: 'artifact',
            name: response.name,
            isPublic: response.is_public,
            publicMagicId: response.public_magic_id,
            isInherited: false,
            isLoading: false,
            onToggle: async () => {
              setIsShareLoading(true);
              try {
                const updated = await artifactService.shareArtifact(artifactId);
                setArtifact((prev) => (prev ? { ...prev, is_public: updated.is_public, public_magic_id: updated.public_magic_id } : null));
                setShareTarget((prev) => (prev ? {
                  ...prev,
                  isPublic: updated.is_public,
                  publicMagicId: updated.public_magic_id,
                } : null));
                setSuccessMessage(
                  updated.is_public
                    ? 'Artifact is now publicly shared'
                    : 'Artifact is now private'
                );
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to toggle sharing';
                setError(message);
              } finally {
                setIsShareLoading(false);
              }
            },
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load artifact');
        setLoading(false);
      });

    return () => {
      // Clear share target when leaving the page
      setShareTarget(null);
    };
  }, [artifactId, setShareTarget]);

  useEffect(() => {
    if (artifact) {
      const typeLabel = artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1);
      document.title = `${artifact.name} | ${typeLabel} | ${siteName}`;
    }
  }, [artifact, siteName]);

  const breadcrumb = artifact
    ? [
        { label: 'My Drive', href: '/workspace', folderId: '00000000-0000-0000-0000-000000000001' },
        ...ancestors.map((f) => ({
          label: f.name,
          href: `/workspace/folders/${f.id}`,
          folderId: f.id,
        })),
        { label: artifact.name },
      ]
    : [{ label: 'My Drive', href: '/workspace' }];

  if (loading) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (error || !artifact) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Artifact not found'}
        </Alert>
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'note') {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <NoteEditor artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'workflow') {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <WorkflowEditor artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'map') {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <MapEditor artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'gallery') {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <GalleryEditor artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'composer') {
    return (
      <WorkspaceLayout
        breadcrumb={breadcrumb}
        leftPanel={
          <ComposerMetaPanel
            artifact={artifact}
            onArtifactUpdate={(updated) => setArtifact(updated)}
          />
        }
      >
        <ComposerEditor artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  if (artifact.type === 'repo') {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <RepoViewer artifact={artifact} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout breadcrumb={breadcrumb}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {artifact.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Type: {artifact.type}
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Artifact viewer coming soon for &quot;{artifact.type}&quot; artifacts
          </Typography>
        </Paper>
      </Box>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </WorkspaceLayout>
  );
}

export default function ArtifactViewerPage() {
  return (
    <ProtectedRoute>
      <ArtifactViewerContent />
    </ProtectedRoute>
  );
}
