import type { Meta, StoryObj } from '@storybook/react'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { StorybookTitles } from 'ui/src/storybook'

const meta = {
  title: StorybookTitles.Atoms,
  component: CopyTextButton,
} satisfies Meta<typeof CopyTextButton>

type Story = StoryObj<typeof meta>

const CopyTextButtonStory: Story = {
  storyName: 'CopyTextButton',
  args: {
    copyText: 'You copied me!',
  },
}

export default meta
export { CopyTextButtonStory }
