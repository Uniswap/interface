/**
 * Web doesn't support font scaling so disabling here avoiding using an expensive hook
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useEnableFontScaling = (allowFontScaling?: boolean): boolean => {
  return false
}
