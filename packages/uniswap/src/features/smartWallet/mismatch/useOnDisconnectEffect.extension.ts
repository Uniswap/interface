/**
 * Extension build only: replaces the default module resolution so we do not bundle
 * `useOnDisconnectEffect.web.tsx`, which statically imports `wagmi` (connector code
 * expects `provider.on` and breaks in the extension UI).
 */
export function useOnDisconnectEffect(): void {}
