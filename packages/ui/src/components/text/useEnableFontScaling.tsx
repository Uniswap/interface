/**
 * Web doesn't support font scaling so disabling here avoiding using an expensive hook
 */

export const useEnableFontScaling = (_allowFontScaling?: boolean): boolean => {
  return false
}
