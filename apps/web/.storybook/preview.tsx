import type { Preview } from '@storybook/react'
import { TamaguiProvider } from '../src/theme/tamaguiProvider'

const preview: Preview = {
  decorators: [
    (Story) => (
      <TamaguiProvider>
        {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
        <Story />
      </TamaguiProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
