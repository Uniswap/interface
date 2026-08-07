import { Navigate, useLocation } from 'react-router'
import { EMBED_BASE_PATH } from '~/pages/embedPaths'
import { createRouteDefinition, StaticTitlesAndDescriptions, type RouteDefinition } from '~/pages/routeDefinition'
import { SwapPage } from '~/pages/Swap'

// Redirect /embed/* deep links back to the entry, preserving the swap query params (and hash).
function EmbedCatchAllRedirect(): JSX.Element {
  const location = useLocation()
  return <Navigate to={{ pathname: EMBED_BASE_PATH, search: location.search, hash: location.hash }} replace />
}

// Entry routes concatenated onto the full route tree for /embed documents (see Body.tsx);
// kept out of `routes` (and its sitemap snapshot) since they're never rendered standalone.
export const EMBED_ENTRY_ROUTES: RouteDefinition[] = [
  createRouteDefinition({
    path: EMBED_BASE_PATH,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
    getElement: () => <SwapPage />,
  }),
  createRouteDefinition({ path: `${EMBED_BASE_PATH}/*`, getElement: () => <EmbedCatchAllRedirect /> }),
]
