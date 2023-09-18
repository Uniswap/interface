import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { Text } from 'ui/src'

export const ON_PRESS_EVENT_PAYLOAD = { nativeEvent: { pageX: Infinity, pageY: Infinity } }

describe(TouchableArea, () => {
  // TODO: onPressIn is not properly setting `touchActivationPositionRef.current`
  it.skip('ignores press when swiping', async () => {
    const onPressSpy = jest.fn()
    render(
      <TouchableArea onPress={onPressSpy}>
        <Text>Button</Text>
      </TouchableArea>
    )
    const button = await screen.findByText('Button')
    fireEvent(button, 'pressIn', ON_PRESS_EVENT_PAYLOAD)

    fireEvent.press(button, { nativeEvent: { pageX: 99, pageY: 99 } })

    expect(onPressSpy).not.toHaveBeenCalled()
  })
})
