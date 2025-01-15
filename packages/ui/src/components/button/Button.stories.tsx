import type { Meta, StoryObj } from '@storybook/react'
import { Button } from 'ui/src/components/button/Button'

const meta = {
  // NOTE: On Web, titles must be statically analyzable at build time in Storybook v8. Please refer to our documentation for valid values.
  // https://github.com/Uniswap/universe/blob/main/docs/storybook.md#storybook-titles
  title: 'Spore/Button',
  component: Button,
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

export const VariantSmall: Story = {
  args: {
    children: 'Hello, world!',
    size: 'small',
  },
}

export const VariantMedium: Story = {
  args: {
    children: 'Hello, world!',
    size: 'medium',
  },
}

export const VariantLarge: Story = {
  args: {
    children: 'Hello, world!',
    size: 'large',
  },
}

export default meta
