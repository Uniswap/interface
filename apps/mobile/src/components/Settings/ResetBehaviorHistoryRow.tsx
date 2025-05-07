import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { resetWalletBehaviorHistory } from 'wallet/src/features/behaviorHistory/slice'

export function ResetBehaviorHistoryRow({ iconProps }: { iconProps: SvgProps }): JSX.Element {
  const dispatch = useDispatch()

  const onPressReset = (): void => {
    dispatch(resetWalletBehaviorHistory())
    dispatch(resetUniswapBehaviorHistory())
  }

  return (
    <TouchableArea onPress={onPressReset}>
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing4">
        <Flex row alignItems="center">
          <Flex centered height={32} width={32}>
            <UniswapIcon {...iconProps} />
          </Flex>
          <Text ml="$spacing12" variant="body1">
            Reset behavior history
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
