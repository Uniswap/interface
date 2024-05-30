import React, { useEffect } from 'react'
import { ViewProps } from 'react-native'
import { Flex, flexStyles, HiddenFromScreenReaders, Text } from 'ui/src'

type MnemonicConfirmationProps = ViewProps & {
  mnemonicId: Address
  onConfirmComplete: () => void
}

/**
 * Replaces MnemonicConfirmation native screen during e2e testing because detox do not support
 * native components
 */
export function MnemonicConfirmation(props: MnemonicConfirmationProps): JSX.Element {
  useEffect(() => {
    props.onConfirmComplete()
  }, [props])

  return (
    <HiddenFromScreenReaders style={flexStyles.fill}>
      <Flex centered>
        <Text variant="body1">Mocked confirmation screen</Text>
      </Flex>
    </HiddenFromScreenReaders>
  )
}
