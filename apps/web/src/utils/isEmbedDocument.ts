import { isEmbedPath } from '~/utils/embedPaths'

// Read once at document load: in-frame navigation can drop /embed, but the document is still a partner iframe.
const IS_EMBED_DOCUMENT = isEmbedPath(window.location.pathname)

/** Whether this document was loaded as an /embed document, regardless of the current in-frame route. */
export function isEmbedDocument(): boolean {
  return IS_EMBED_DOCUMENT
}
