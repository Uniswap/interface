import { Story } from '@storybook/react/types-6-0'
import React from 'react'
import { HashRouter } from 'react-router-dom'
import styled from 'styled-components/macro'
import Component from './index'

const Wrapper = styled.div`
  max-width: 150px;
  margin-left: 300px;
`
export default {
  title: 'Menu',
  decorators: [
    () => (
      <HashRouter>
        <Wrapper>
          <Component />
        </Wrapper>
      </HashRouter>
    ),
  ],
}

const Template: Story<any> = (args) => <Component {...args} />

export const Menu = Template.bind({})
Menu.args = {}
