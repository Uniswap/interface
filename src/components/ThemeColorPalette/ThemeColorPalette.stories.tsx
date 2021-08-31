import { Story } from '@storybook/react/types-6-0'
import React from 'react'
import Component from './index'

export default {
  title: 'ThemeColorPalette',
}

const Template: Story<any> = (_args: any, context: Record<string, any>) => {
  const isDarkMode = context.globals.theme === 'dark'
  return <Component isDarkMode={isDarkMode} />
}

export const Palette = Template.bind({})
