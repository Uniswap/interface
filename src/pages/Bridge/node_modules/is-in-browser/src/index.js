export const isBrowser = typeof window === "object"
    && typeof document === 'object'
    && document.nodeType === 9;

export default isBrowser;
