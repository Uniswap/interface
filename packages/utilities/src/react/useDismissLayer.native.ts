/** No-ops on native — the web overlays this coordinates (and their Escape handling) are web-only. */
export function useDismissLayer(_params: { isOpen: boolean; onClose?: () => void }): void {}

export function markRadixEscapePreventedBySheet(_event: KeyboardEvent): void {}
