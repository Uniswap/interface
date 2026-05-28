export enum OS {
  Macos = 'macos',
  Windows = 'windows',
  Linux = 'linux',
}

export const getCurrentOS = (): OS => {
  switch (process.platform) {
    case 'darwin':
      return OS.Macos
    case 'win32':
      return OS.Windows
    case 'linux':
      return OS.Linux
    default:
      throw new Error(`Unsupported OS: ${process.platform}`)
  }
}

/**
 * Exhaustive per-OS dispatch. Each branch is a thunk so callers can return values that
 * close over local arguments (e.g. URL → command argv). Throws on unsupported platforms
 * via `getCurrentOS`.
 */
export const switchOS = <T>(cases: Record<OS, () => T>): T => cases[getCurrentOS()]()
