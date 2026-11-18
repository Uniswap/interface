import type { Decorator, Preview } from '@storybook/react-vite'

interface PreviewOptions {
  /** axe rule tags; pass AXE_TAGS from @universe/mycelium/testing so every runner checks the same rules. */
  axeTags: readonly string[]
  /** Selectors axe skips, on top of Storybook's own chrome; pass AXE_EXCLUDE from @universe/mycelium/testing. */
  axeExclude?: readonly string[]
  /** Decorators that wrap every story, inside the theme decorator. */
  decorators?: Decorator[]
}

/**
 * The preview every Storybook shares: a light/dark theme toolbar and the a11y defaults. A story
 * that fails its a11y check fails its test. For a known failure, disable only the failing rule with
 * `parameters: { a11y: { config: { rules: [{ id, enabled: false }] } } }` and say why; `test: 'todo'`
 * would hide every other rule too. To check hover or focus colours, add a story with
 * `parameters: { pseudo: { hover: true } }` (or `focusVisible`); the Storybook's Tailwind entry must
 * import `storybook-presets/pseudo-states.css`.
 *
 * axe also returns "needs review" results (`incomplete`): checks it couldn't settle, such as
 * contrast over a gradient or under an overlay. The addon ignores them; `a11yIncompleteSetup.ts`
 * fails the story test unless the story lists the rule in `parameters.a11y.incomplete` with a reason.
 */
export function createPreview({ axeTags, axeExclude = [], decorators = [] }: PreviewOptions): Preview {
  return {
    decorators: [...decorators, withTheme, withTestPadding],
    globalTypes: {
      theme: {
        description: 'Color theme',
        toolbar: {
          title: 'Theme',
          icon: 'mirror',
          items: [
            { value: 'light', title: 'Light' },
            { value: 'dark', title: 'Dark' },
          ],
          dynamicTitle: true,
        },
      },
    },
    initialGlobals: { theme: 'light' },
    parameters: {
      controls: {
        matchers: {
          color: /(background|color)$/i,
          date: /Date$/i,
        },
      },
      // The pseudo-states addon looks for #storybook-root, which story tests don't render, and menus
      // portal outside it; body covers both.
      pseudo: { rootSelector: 'body' },
      a11y: {
        options: { runOnly: { type: 'tag', values: [...axeTags] } },
        context: { exclude: [...axeExclude] },
        test: 'error',
      },
    },
  }
}

/**
 * Mycelium reads the theme from a `dark` class on <html>, synchronously during render, so the
 * class is set here rather than in an effect, which would run after the story's first render.
 */
const withTheme: Decorator = (Story, { globals }) => {
  document.documentElement.classList.toggle('dark', globals['theme'] === 'dark')
  return <Story />
}

/**
 * Story tests don't load the Storybook UI's iframe CSS, so its default `padded` layout (1rem) is
 * missing and stories render flush against the viewport edge. Text there runs past the edge, and
 * axe can't sample its background.
 */
const withTestPadding: Decorator = (Story, { parameters }) =>
  import.meta.env.VITEST_STORYBOOK === 'false' && parameters['layout'] !== 'fullscreen' ? (
    <div style={{ padding: '1rem' }}>
      <Story />
    </div>
  ) : (
    <Story />
  )
