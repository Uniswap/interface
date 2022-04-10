import { Story } from '@storybook/react/types-6-0'
import React, { PropsWithChildren } from 'react'
import Component, { BadgeProps, BadgeVariant } from './../Badge/index'
import { PotionIcon } from './Potions'

export default {
  title: 'Potions',
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

// @ts-ignore
const Template: Story<PropsWithChildren<BadgeProps>> = (args) => <PotionIcon {...args}>{args.children}</PotionIcon>

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
