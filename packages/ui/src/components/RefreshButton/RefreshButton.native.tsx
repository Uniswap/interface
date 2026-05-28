import type { RefreshButtonProps } from 'ui/src/components/RefreshButton/RefreshButton'
import { RefreshButtonIcon } from 'ui/src/components/RefreshButton/RefreshButtonIcon'

/**
 * A button component that allows users to refresh their balance with a visual indicator
 * and keyboard shortcut support.
 *
 * @component
 * @example
 * ```tsx
 * <Flex group>
 *   <RefreshButton
 *     onPress={() => refetchBalance()}
 *     isLoading={isRefetchingBalancing}
 *   />
 * </Flex>
 * ```
 *
 * @param {() => void} onPress - Callback function to execute when the refresh button is pressed
 * @param {boolean} isLoading - Indicates whether a refresh operation is in progress
 *
 * @returns {JSX.Element} An animated refresh icon button
 */
export function RefreshButton({ onPress, isLoading }: RefreshButtonProps): JSX.Element {
  return <RefreshButtonIcon isLoading={isLoading} onPress={onPress} />
}
