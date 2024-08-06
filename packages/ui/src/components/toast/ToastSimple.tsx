import { PropsWithChildren } from 'react'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout'
import { TouchableArea } from 'ui/src/components/touchable'

const MAX_WIDTH = 348

export function ToastSimple({ children, onDismiss }: PropsWithChildren<{ onDismiss?: () => void }>): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      animation="fastHeavy"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius={16}
      borderWidth={1}
      enterStyle={{
        left: MAX_WIDTH + 20,
      }}
      exitStyle={{
        left: MAX_WIDTH + 20,
      }}
      justifyContent="space-between"
      left={0}
      p={16}
      position="relative"
      width={MAX_WIDTH}
    >
      <Flex row alignItems="center" gap={12}>
        {children}
      </Flex>
      {onDismiss ? (
        <TouchableArea onPress={onDismiss}>
          <X color="$neutral2" size={16} />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
