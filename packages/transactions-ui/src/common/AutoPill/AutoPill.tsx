import { Flex, Text } from '@universe/mycelium'

export interface AutoPillProps {
  /** Generic copy, translated by the caller: the slippage and gas rows use different existing keys. */
  label: string
}

/** The small "Auto" badge shown when a setting (slippage, network cost) is on its automatic value. */
export function AutoPill({ label }: AutoPillProps): JSX.Element {
  return (
    <Flex centered backgroundColor="$surface3" borderRadius="$rounded6" height={20} px="$spacing8">
      <Text color="$neutral1" lineHeight={16} variant="buttonLabel4">
        {label}
      </Text>
    </Flex>
  )
}
