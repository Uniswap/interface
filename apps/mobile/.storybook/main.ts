import type { StorybookConfig } from '@storybook/react-native'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/ui/src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/uniswap/src/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  addons: ['@storybook/addon-ondevice-controls'],
}

export default config
