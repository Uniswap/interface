/**
 * Utility for identifying trivial files that should be filtered from changelog analysis
 */

const TRIVIAL_PATTERNS = [
  // Lockfiles
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /bun\.lockb$/,
  /Cargo\.lock$/,
  /Gemfile\.lock$/,
  /composer\.lock$/,
  /poetry\.lock$/,

  // Snapshots
  /\.snap$/,
  /\.snap\.\w+$/,
  /\/__snapshots__\//,
  /\.snapshot$/,
  /\.snapshot\.json$/,

  // Generated files
  /\.generated\./,
  /\/__generated__\//,
  /\/generated\//,
  /codegen\//,

  // Build artifacts
  /^dist\//,
  /^build\//,
  /\.next\//,
  /\.turbo\//,
  /^out\//,

  // Test artifacts
  /^coverage\//,
  /\.lcov$/,
  /\.nyc_output\//,
  /test-results\//,

  // Large data files
  /fixtures\//,
  /\/__fixtures__\//,
  /testdata\//,

  // Binary and media files
  /\.(png|jpg|jpeg|gif|ico|svg|webp|pdf|zip|tar|gz)$/i,

  // IDE and OS files
  /\.DS_Store$/,
  /Thumbs\.db$/,
  /\.swp$/,
  /\.swo$/,

  // Other
  /node_modules\//,
  /vendor\//,
  /\.pnp\./,
]

/**
 * Check if a file path represents a trivial file that should be filtered
 */
export function isTrivialFile(path: string): boolean {
  return TRIVIAL_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Filter an array of file paths to exclude trivial files
 */
export function filterTrivialFiles(paths: string[]): string[] {
  return paths.filter((path) => !isTrivialFile(path))
}
