import { Currency } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { TokenBalanceListWeb } from 'uniswap/src/components/portfolio/TokenBalanceListWeb'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
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

  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)
  const openReportTokenModal = useEvent((currency: Currency, isMarkedSpam: Maybe<boolean>) => {
    setModalProps({ source: 'portfolio', currency, isMarkedSpam })
    openModal()
  })

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
        openReportTokenModal={openReportTokenModal}
      />
    </Flex>
  )
}
