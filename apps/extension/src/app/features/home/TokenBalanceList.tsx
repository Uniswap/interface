import { Currency } from '@uniswap/sdk-core'
import { memo, useState } from 'react'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { TokenBalanceListWeb } from 'uniswap/src/components/portfolio/TokenBalanceListWeb'
import { ReportTokenIssueModal } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
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

  const { value: isReportTokenModalOpen, setTrue: openModal, setFalse: closeReportTokenModal } = useBooleanState(false)
  const [reportTokenCurrency, setReportTokenCurrency] = useState<Currency | undefined>(undefined)
  const [isMarkedSpam, setIsMarkedSpam] = useState<Maybe<boolean>>(undefined)

  const openReportTokenModal = useEvent((currency: Currency, isMarkedSpam: Maybe<boolean>) => {
    setReportTokenCurrency(currency)
    setIsMarkedSpam(isMarkedSpam)
    openModal()
  })

  const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()
  return (
    <>
      <TokenBalanceListWeb
        evmOwner={owner}
        onPressReceive={onPressReceive}
        onPressBuy={onPressBuy}
        openReportTokenModal={openReportTokenModal}
        backgroundImageWrapperCallback={backgroundImageWrapperCallback}
      />
      {reportTokenCurrency && (
        <ReportTokenIssueModal
          isOpen={isReportTokenModalOpen}
          onClose={closeReportTokenModal}
          currency={reportTokenCurrency}
          isMarkedSpam={isMarkedSpam}
        />
      )}
    </>
  )
})
