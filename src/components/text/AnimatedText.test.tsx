import React from 'react'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { render } from 'src/test/test-utils'

describe(AnimatedText, () => {
  it('renders without error', () => {
    const tree = render(<AnimatedText text={{ value: 'Rendered' }} />)

    expect(tree).toMatchInlineSnapshot(`
      <TextInput
        allowFontScaling={true}
        animatedProps={
          Object {
            "text": "Rendered",
          }
        }
        editable={false}
        maxFontSizeMultiplier={1.4}
        style={
          Array [
            Array [
              Object {},
            ],
          ]
        }
        underlineColorAndroid="transparent"
        value="Rendered"
      />
    `)
  })
})
