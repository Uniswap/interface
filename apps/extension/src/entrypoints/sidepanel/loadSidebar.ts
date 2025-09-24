/**
 * IMPORTANT: we should keep this file very light. Do not import anything here.
 *
 * The browser was taking too long to interpret the react JS bundle and initialize the react app,
 * so we're now splitting this up and slightly delaying the react bundle execution.
 * By doing this, the first render happens faster and there's no longer a flash of a different color background (the default "no background" color).
 * Instead, the HTML is now rendered immediately, with the right background color from the inline style.
 *
 * For video comparison of the before and after, check out https://github.com/Uniswap/universe/pull/9294
 */

function makeLoadSidebar(): void {
  setTimeout(() => {
    import('./main')
  }, 10)
}

makeLoadSidebar()
