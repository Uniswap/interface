import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { isEmbedPath } from '~/pages/embedPaths'

/**
 * Which surface an /embed document renders. Selected by the `view` query param at the
 * embed boundary (see App.tsx) and carried through context so deep components don't
 * re-parse the URL (and so it stays sticky across in-frame client-side navigation).
 *  - 'full' (default, or `?view=full`): the complete mweb app (full chrome + route tree).
 *  - 'swap' (`?view=swap`): the stripped swap-only surface (no app chrome, swap tab only).
 */
export type EmbedView = 'full' | 'swap'

/** Query param read at the /embed entry point to choose the embed surface. */
export const EMBED_VIEW_PARAM = 'view'

interface EmbedContextValue {
  /** The selected embed surface. Always 'full' outside an embed document. */
  view: EmbedView
}

const EmbedContext = createContext<EmbedContextValue>({ view: 'full' })

/**
 * Parse the `view` query param that selects the embed surface. Anything other than the
 * explicit opt-in `view=swap` (including a missing param) resolves to the default 'full'.
 */
export function parseEmbedView(search: string): EmbedView {
  return new URLSearchParams(search).get(EMBED_VIEW_PARAM) === 'swap' ? 'swap' : 'full'
}

/**
 * Capture embedded-ness and the embed surface once at mount from the live URL, then keep them
 * sticky for the session so in-frame navigation (which may drop /embed or `view`) can't flip them.
 */
export function useEmbedSession(): { embedded: boolean; view: EmbedView } {
  const [session] = useState(() => ({
    embedded: isEmbedPath(window.location.pathname),
    view: parseEmbedView(window.location.search),
  }))
  return session
}

export function EmbedProvider({ view = 'full', children }: { view?: EmbedView; children: ReactNode }): JSX.Element {
  const value = useMemo(() => ({ view }), [view])
  return <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>
}

export function useEmbedView(): EmbedView {
  return useContext(EmbedContext).view
}
