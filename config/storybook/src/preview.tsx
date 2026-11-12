import type { Decorator, Preview } from '@storybook/react-vite'

interface PreviewOptions {
  /** axe rule tags; pass AXE_TAGS from @universe/mycelium/testing so every runner checks the same rules. */
  axeTags: readonly string[]
  /** Decorators that wrap every story, inside the theme decorator. */
  decorators?: Decorator[]
}

/**
 * The preview every Storybook shares: a light/dark theme toolbar and the a11y defaults. A story
 * that fails its a11y check fails its test; mark a known failure with
 * `parameters: { a11y: { test: 'todo' } }` until it's fixed.
 */
export function createPreview({ axeTags, decorators = [] }: PreviewOptions): Preview {
  return {
    decorators: [...decorators, withTheme],
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
      a11y: {
        options: { runOnly: { type: 'tag', values: [...axeTags] } },
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
