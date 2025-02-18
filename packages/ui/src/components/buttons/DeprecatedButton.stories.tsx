import type { Meta, StoryObj } from '@storybook/react'
import { DeprecatedButton } from 'ui/src/components/buttons/DeprecatedButton'

const meta = {
  title: 'Components/Buttons',
  component: DeprecatedButton,
} satisfies Meta<typeof DeprecatedButton>

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
