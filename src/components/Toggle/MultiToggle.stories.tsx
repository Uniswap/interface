import { Story } from '@storybook/react/types-6-0'
import styled from 'styled-components'
import React, { useState } from 'react'
import MultiToggle from './MultiToggle'

const wrapperCss = styled.main`
  font-size: 2em;
  margin: 3em;
  max-width: 300px;
`

export default {
  title: 'Toggles',
  argTypes: {
    width: { control: { type: 'string' } },
  },
  decorators: [
    (Component: Story) => (
      <div css={wrapperCss}>
        <Component />
      </div>
    ),
  ],
}

export const MultiToggleExample = () => {
  const [active, setActive] = useState(0)

  function doSomethingWithIndex(index: number) {
    // here's where youd update state based on index choice
    // switch(index){} ...
    setActive(index)
  }
  return <MultiToggle toggle={doSomethingWithIndex} activeIndex={active} options={['option1', 'option2', 'option3']} />
}
