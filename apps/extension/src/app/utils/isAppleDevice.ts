/**
 * Checks if the operating system is macOS.
 * @returns {boolean} - True if the OS is macOS, otherwise false.
 */
export function isAppleDevice(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}
