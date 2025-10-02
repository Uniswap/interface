import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { TokenBalanceListWeb } from 'uniswap/src/components/portfolio/TokenBalanceListWeb'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { noop } from 'utilities/src/react/noop'
import { getChainUrlParam } from 'utils/chainParams'

export default function TokensTab({
  evmOwner,
  svmOwner,
}: {
  evmOwner: Address | undefined
  svmOwner: Address | undefined
}): JSX.Element {
  const accountDrawer = useAccountDrawer()
  const { isTestnetModeEnabled } = useEnabledChains()
  const navigate = useNavigate()

  const navigateToTokenDetails = useCallback(
    async (currencyId: CurrencyId) => {
      const address = currencyIdToAddress(currencyId)
      const chain = currencyIdToChain(currencyId)

      if (isTestnetModeEnabled || !chain) {
        return
      }

      navigate(
        getTokenDetailsURL({
          address,
          chain,
          chainUrlParam: getChainUrlParam(chain),
          inputAddress: address,
        }),
      )
      accountDrawer.close()
    },
    [accountDrawer, isTestnetModeEnabled, navigate],
  )

  return (
    <Flex mx="$spacing8">
      <TokenBalanceListWeb
        evmOwner={evmOwner}
        svmOwner={svmOwner}
        onPressReceive={noop}
        onPressBuy={noop}
        onPressToken={navigateToTokenDetails}
      />
    </Flex>
  )
}
