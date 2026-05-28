/**
 * Generic utility helpers shared across team monitor files.
 * Anything not team-specific lives here so it doesn't drift across teams.
 */

/**
 * Convert PascalCase to snake_case for monitor IDs.
 *
 * Note: this is a simple single-capital splitter — it does NOT collapse runs
 * of capitals (e.g. `OPRFEvaluate` becomes `o_p_r_f_evaluate`, not
 * `oprf_evaluate`). Acceptable for current callers; if you add endpoints
 * whose proto names contain abbreviations, extend the regex.
 */
export function snakeCase(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}
