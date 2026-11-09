import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { DraftContext, EMPTY_DRAFT, clearBrowserStorage, type Draft } from './draft-context';

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  const setDraft = useCallback((updater: (d: Draft) => Draft) => setDraftState(updater), []);
  const clearAll = useCallback(() => {
    clearBrowserStorage();
    setDraftState(EMPTY_DRAFT);
  }, []);
  const value = useMemo(() => ({ draft, setDraft, clearAll }), [draft, setDraft, clearAll]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}
