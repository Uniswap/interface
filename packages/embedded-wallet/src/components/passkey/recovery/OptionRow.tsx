import type { ReactNode } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import type { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function OptionRow({
  icon,
  label,
  onPress,
  element,
  loading,
  disabled,
}: {
  icon: ReactNode
  label: string
  onPress?: () => void
  element: ElementName
  loading?: boolean
  disabled?: boolean
}): JSX.Element {
  const isDisabled = !onPress || disabled
  return (
    <Trace logPress element={element}>
      <TouchableArea width="100%" disabled={isDisabled} onPress={onPress}>
        <Flex
          row
          gap="$gap12"
          alignItems="center"
          width="100%"
          p="$spacing12"
          backgroundColor="$surface2"
          opacity={isDisabled ? 0.5 : 1}
        >
          <Flex
            height={32}
            width={32}
            backgroundColor="$surface1"
            borderRadius="$rounded8"
            borderWidth={1}
            borderColor="$surface3"
            alignItems="center"
            justifyContent="center"
          >
            {icon}
          </Flex>
          <Text variant="body2" flex={1}>
            {label}
          </Text>
          {loading && <SpinningLoader size={20} color="$neutral2" />}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
