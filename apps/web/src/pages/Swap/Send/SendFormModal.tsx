import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useCurrency } from 'hooks/Tokens'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { SendForm, SendFormProps } from 'pages/Swap/Send/SendForm'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { SendContextProvider } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import noop from 'utilities/src/react/noop'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

type SendFormModalProps = {
  isModalOpen: boolean
  onClose: () => void
} & SendFormProps

export function SendFormModal(props: SendFormModalProps) {
  const { isModalOpen, onClose } = props
  const [searchParams] = useSearchParams()
  const chainParam = searchParams.get('chain') ?? undefined
  const chainId = getChainIdFromChainUrlParam(chainParam)
  const inputCurrencyParam = searchParams.get('inputCurrency') ?? undefined
  const parsedInputCurrency = useCurrency({ address: inputCurrencyParam, chainId })
  const inputCurrency = useMemo(
    () => parsedInputCurrency ?? nativeOnChain(UniverseChainId.Mainnet),
    [parsedInputCurrency],
  )

  return (
    <Trace page={InterfacePageName.Send}>
      {/* TODO(WEB-7867): This context is required to set defaults and needs to be decoupled */}
      <SwapAndLimitContext.Provider
        value={{
          currentTab: SwapTab.Send,
          setCurrentTab: noop,
          setCurrencyState: noop,
          currencyState: { inputCurrency },
        }}
      >
        <SendContextProvider>
          <TransactionModal modalName={ModalName.Send} onClose={noop}>
            <Modal
              name={ModalName.Send}
              isModalOpen={isModalOpen}
              onClose={onClose}
              maxWidth={420}
              paddingX="$padding8"
              pb="$padding8"
              pt="$padding12"
            >
              <SendFormModalInner {...props} />
            </Modal>
          </TransactionModal>
        </SendContextProvider>
      </SwapAndLimitContext.Provider>
    </Trace>
  )
}

const SendFormModalInner = (props: SendFormModalProps) => {
  const { isModalOpen: _isModalOpen, onClose, ...rest } = props
  const { t } = useTranslation()
  const { setScreen, screen } = useTransactionModalContext()
  const goBack = useCallback(() => {
    setScreen(TransactionScreen.Form)
  }, [setScreen])

  return (
    <ContentWrapper>
      <GetHelpHeader
        link={uniswapUrls.helpArticleUrls.transferCryptoHelp}
        title={screen === TransactionScreen.Review ? t('sendReviewModal.title') : t('title.sendCrypto')}
        closeModal={onClose}
        goBack={screen === TransactionScreen.Review ? goBack : undefined}
      />
      <Flex mt="$spacing12">
        <SendForm {...rest} />
      </Flex>
    </ContentWrapper>
  )
}
