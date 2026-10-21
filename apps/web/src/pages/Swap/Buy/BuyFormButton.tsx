import { isSVMChain } from '@universe/chains'
import { Button, type ButtonProps } from '@universe/mycelium'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsShortMobileDevice } from 'ui/src'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { CexTransferInfoModal } from 'uniswap/src/features/fiatOnRamp/CexTransferInfoModal'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { useIsForRegionBlocked } from 'uniswap/src/features/fiatOnRamp/useIsForRegionBlocked'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useOpenReceiveCryptoModal } from '~/components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useConnectionStatus } from '~/features/accounts/store/hooks'
import { useBuyFormContext } from '~/pages/Swap/Buy/BuyFormContext'
import { ReceiveModalState } from '~/types/receiveCryptoModal'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const isDisconnected = useConnectionStatus('aggregate').isDisconnected
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount, quoteCurrency, rampDirection } = buyFormState
  const isForRegionBlocked = useIsForRegionBlocked({ isOfframp: rampDirection === RampDirection.OFF_RAMP })
  const [isCexTransferModalOpen, setIsCexTransferModalOpen] = useState(false)
  const openReceiveModal = useOpenReceiveCryptoModal({ modalState: ReceiveModalState.DEFAULT })
  const openCexTransferModal = () => setIsCexTransferModalOpen(true)
  const closeCexTransferModal = () => setIsCexTransferModalOpen(false)
  const receiveFromCexTransferModal = () => {
    closeCexTransferModal()
    openReceiveModal()
  }

  const { notAvailableInThisRegion, quotes, fetchingQuotes, amountOutLoading, error } = derivedBuyFormInfo
  const chainId = quoteCurrency?.currencyInfo?.currency.chainId
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)

  const buttonSize: ButtonProps['size'] = isShortMobileDevice ? 'small' : 'large'

  if (isDisconnected || isMissingPlatformWallet) {
    return (
      <Button size={buttonSize} variant="branded" emphasis="secondary" fill onPress={accountDrawer.open}>
        {isMissingPlatformWallet
          ? t('common.connectTo', {
              platform: chainId && isSVMChain(chainId) ? SOLANA_CHAIN_INFO.name : MAINNET_CHAIN_INFO.name,
            })
          : t('common.connectWallet.button')}
      </Button>
    )
  }

  if (isForRegionBlocked) {
    return (
      <>
        <Button size={buttonSize} variant="branded" emphasis="secondary" fill onPress={openCexTransferModal}>
          {t('fiatOnRamp.cexTransferModal.title')}
        </Button>
        <CexTransferInfoModal
          isOpen={isCexTransferModalOpen}
          onClose={closeCexTransferModal}
          onPressReceive={receiveFromCexTransferModal}
        />
      </>
    )
  }

  if (!inputAmount || forceDisabled || notAvailableInThisRegion || !quoteCurrency) {
    return (
      <Button size={buttonSize} key="BuyFormButton" disabled>
        {notAvailableInThisRegion
          ? t('common.notAvailableInRegion.error')
          : quoteCurrency
            ? t('common.noAmount.error')
            : t('common.selectToken.label')}
      </Button>
    )
  }

  return (
    <Button
      size={buttonSize}
      variant="branded"
      loading={fetchingQuotes || amountOutLoading}
      key="BuyFormButton"
      disabled={Boolean(fetchingQuotes || !quotes || quotes.quotes.length === 0 || error)}
      onPress={() => {
        setBuyFormState((prev) => ({ ...prev, providerModalOpen: true }))
      }}
    >
      {t('common.button.continue')}
    </Button>
  )
}
