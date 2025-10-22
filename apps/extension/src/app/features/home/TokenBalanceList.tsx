import { memo } from 'react'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { TokenBalanceListWeb } from 'uniswap/src/components/portfolio/TokenBalanceListWeb'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { usePortfolioEmptyStateBackground } from 'wallet/src/components/portfolio/empty'

export const ExtensionTokenBalanceList = memo(function _ExtensionTokenBalanceList({
  owner,
}: {
  owner: Address
}): JSX.Element {
  const onPressReceive = (): void => {
    navigate(`/${AppRoutes.Receive}`)
  }
  const onPressBuy = useInterfaceBuyNavigator(ElementName.EmptyStateBuy)
  const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()
  return (
    <TokenBalanceListWeb
      evmOwner={owner}
      onPressReceive={onPressReceive}
      onPressBuy={onPressBuy}
      backgroundImageWrapperCallback={backgroundImageWrapperCallback}
    />
  )
})
