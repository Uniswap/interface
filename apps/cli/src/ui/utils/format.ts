/**
 * Text formatting utilities for UI components
 */

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}

export function formatVersion(version: string): string {
  return version
}

export function formatBranch(branch: string): string {
  return branch.replace('origin/releases/', '')
}
