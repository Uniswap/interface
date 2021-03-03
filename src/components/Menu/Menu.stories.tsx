import { Story } from '@storybook/react/types-6-0'
import React from 'react'
import styled from 'styled-components'
import Component from './index'

const Wrapper = styled.div`
  max-width: 150px;
`
export default {
  title: 'Menu',
  decorators: [
    () => (
      <Wrapper>
        <Component />
      </Wrapper>
    ),
  ],
}

const Template: Story<any> = (args) => <Component {...args} />

export const Menu = Template.bind({})
Menu.args = {}
