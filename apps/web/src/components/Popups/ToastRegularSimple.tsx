import { PropsWithChildren } from 'react'
import { AnimatePresence } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout'
import { TouchableArea } from 'ui/src/components/touchable'

const MAX_WIDTH = 348

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  children,
  onDismiss,
}: PropsWithChildren<{ onDismiss?: () => void }>): JSX.Element {
  return (
    <AnimatePresence>
      <Flex
        row
        alignItems="center"
        animation="fastHeavy"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        enterStyle={{ left: MAX_WIDTH + 20 }}
        exitStyle={{ left: MAX_WIDTH + 20 }}
        justifyContent="space-between"
        top="$none"
        left={0}
        mx={0}
        $sm={{
          left: 'unset',
          mx: 'auto',
          width: 'max-content',
          enterStyle: { top: -20 },
          exitStyle: { top: -20, opacity: 0 },
        }}
        p="$spacing16"
        position="relative"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 25 }}
        shadowOpacity={0.2}
        shadowRadius={50}
        width={MAX_WIDTH}
      >
        <Flex row alignItems="center" gap={12}>
          {children}
        </Flex>
        {onDismiss ? (
          <TouchableArea onPress={onDismiss}>
            <X color="$neutral2" size={16} ml="$spacing8" />
          </TouchableArea>
        ) : null}
      </Flex>
    </AnimatePresence>
  )
}
