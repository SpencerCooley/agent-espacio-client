'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ShareTarget {
  id: string;
  type: 'folder' | 'asset' | 'artifact';
  name: string;
  isPublic: boolean;
  publicMagicId: string | null;
  isInherited: boolean;
  onToggle: () => Promise<void>;
  isLoading?: boolean;
}

interface ShareContextValue {
  shareTarget: ShareTarget | null;
  setShareTarget: React.Dispatch<React.SetStateAction<ShareTarget | null>>;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const ShareContext = createContext<ShareContextValue>({
  shareTarget: null,
  setShareTarget: () => {},
  modalOpen: false,
  setModalOpen: () => {},
});

export function useShareContext() {
  return useContext(ShareContext);
}

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <ShareContext.Provider value={{ shareTarget, setShareTarget, modalOpen, setModalOpen }}>
      {children}
    </ShareContext.Provider>
  );
}
