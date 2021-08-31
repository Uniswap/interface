import { Story } from '@storybook/react/types-6-0'
import React, { PropsWithChildren } from 'react'
import Component, { BadgeProps, BadgeVariant } from './index'

export default {
  title: 'Badge',
  argTypes: {
    variant: {
      name: 'variant',
      type: { name: 'string', require: false },
      defaultValue: BadgeVariant.DEFAULT,
      description: 'badge variant',
      control: {
        type: 'select',
        options: Object.values(BadgeVariant),
      },
    },
  },
  args: {
    children: '🦄 UNISWAP 🦄',
  },
}

const Template: Story<PropsWithChildren<BadgeProps>> = (args) => <Component {...args}>{args.children}</Component>

export const DefaultBadge = Template.bind({})
DefaultBadge.args = {
  variant: BadgeVariant.DEFAULT,
}

export const WarningBadge = Template.bind({})
WarningBadge.args = {
  variant: BadgeVariant.WARNING,
}

export const NegativeBadge = Template.bind({})
NegativeBadge.args = {
  variant: BadgeVariant.NEGATIVE,
}

export const PositiveBadge = Template.bind({})
PositiveBadge.args = {
  variant: BadgeVariant.POSITIVE,
}
