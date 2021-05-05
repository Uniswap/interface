import { Story } from '@storybook/react/types-6-0'
import React from 'react'
import { DAI, WBTC } from '../../constants'
import Component, { DoubleCurrencyLogoProps } from './index'

export default {
  title: 'DoubleCurrencyLogo',
  decorators: [],
}

const Template: Story<DoubleCurrencyLogoProps> = (args) => <Component {...args} />

export const DoubleCurrencyLogo = Template.bind({})
DoubleCurrencyLogo.args = {
  currency0: DAI,
  currency1: WBTC,
  size: 220,
}
