import { noop } from 'utilities/src/react/noop'

// Same paths as RouteDefinitions, so these warm the routes' own chunks. Failures are ignored; the route retries itself.
// They live in pages/routes/, the shared route folder every page may import.

export function preloadTokenDetailsChunk(): void {
  void import('~/pages/TokenDetails/TokenDetailsPage').catch(noop)
}

export function preloadAuctionChunk(): void {
  void import('~/pages/Explore/ToucanToken').catch(noop)
}
