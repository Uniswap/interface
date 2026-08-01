/**
 * Helpers for renaming the IIFE var that WXT emits for content scripts.
 *
 * WXT builds each content script as a classic IIFE assigned to a top-level var named
 * `safeVarName(entrypoint.name)` (Vite `build.lib.name`), and its `wxt:iife-footer`
 * plugin appends a bare `<name>;` expression to the entry chunk so
 * `scripting.executeScript` can read the entry's return value.
 *
 * We rename that var (see `RENAMED_IIFE_PREFIX`) because for MAIN-world content scripts
 * the top-level `var ethereum = (IIFE)()` assignment executes in the page's global scope
 * AFTER the IIFE body has set `window.ethereum` to our provider proxy — clobbering it
 * with the IIFE's return value. The footer must be rewritten to match the renamed var:
 * a dangling `<originalName>;` throws an uncaught
 * `ReferenceError: <originalName> is not defined` on every page the content script runs
 * in (see PR #35344; same incident class as PR #33221 / INC-283).
 */

const RENAMED_IIFE_PREFIX = '__wxt_cs_'

/** Returns the collision-safe IIFE var name for a content script entrypoint name. */
export function getRenamedIifeName(originalName: string): string {
  return `${RENAMED_IIFE_PREFIX}${originalName}`
}

/**
 * True when `code` ends with `identifier;` as a standalone statement — i.e. not as the
 * suffix of a longer identifier (`notinjected;` must not match `injected;`).
 */
function endsWithStandaloneIdentifierStatement(code: string, identifier: string): boolean {
  const statement = `${identifier};`
  if (!code.endsWith(statement)) {
    return false
  }
  const charBefore = code[code.length - statement.length - 1]
  return charBefore === undefined || !/[\w$]/.test(charBefore)
}

/**
 * Rewrites the trailing `<originalName>;` iife-footer of a content script entry chunk to
 * reference the renamed IIFE var. Idempotent: code that already ends with the renamed
 * footer is returned unchanged.
 *
 * @throws when neither footer is present — e.g. WXT changed its footer format. Failing
 * the build loudly is deliberate: silently shipping a dangling identifier reintroduces
 * the every-page ReferenceError this module exists to prevent.
 */
export function rewriteIifeFooter({ code, originalName }: { code: string; originalName: string }): string {
  const renamedName = getRenamedIifeName(originalName)

  if (endsWithStandaloneIdentifierStatement(code, renamedName)) {
    return code
  }

  if (endsWithStandaloneIdentifierStatement(code, originalName)) {
    return `${code.slice(0, -`${originalName};`.length)}${renamedName};`
  }

  throw new Error(
    `[contentScriptIifeRename] Expected the "${originalName}" content script entry chunk to end with WXT's ` +
      `iife-footer ("${originalName};") so it can be renamed to "${renamedName};". WXT's footer format may have ` +
      `changed — update apps/extension/config/contentScriptIifeRename.ts. Shipping without the rename throws an ` +
      `uncaught ReferenceError on every page the content script runs in.`,
  )
}
