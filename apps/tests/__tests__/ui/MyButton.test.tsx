import React from 'react'
import { renderUi } from '../../src'

import { Button } from 'ui/src/components/my-button/MyButton'

describe('<MyButton />', () => {
  it('has 1 child', () => {
    const { type, children } = renderUi(<Button>hello</Button>).toJSON()
    expect(type).toBe('div')
    expect(children.length).toBe(1)
  })
})
