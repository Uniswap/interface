import { useCurrency } from 'hooks/Tokens'
import { SendForm, SendFormProps } from 'pages/Swap/Send/SendForm'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { SendContextProvider } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { Flex, ModalCloseIcon, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { noop } from 'utilities/src/react/noop'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

type SendFormModalProps = {
  isModalOpen: boolean
  onClose: () => void
} & SendFormProps

export function SendFormModal(props: SendFormModalProps) {
  const { onClose, isModalOpen } = props
  const [searchParams] = useSearchParams()
  const chainParam = searchParams.get('sendChain') ?? undefined
  const chainId = getChainIdFromChainUrlParam(chainParam)
  const inputCurrencyParam = searchParams.get('sendCurrency') ?? undefined
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
              padding="$padding16"
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
  const { screen } = useTransactionModalContext()
  const title = screen === TransactionScreen.Review ? t('sendReviewModal.title') : t('title.sendCrypto')

  return (
    <Flex backgroundColor="$surface1" width="100%" flex={1} position="relative" gap="$spacing24">
      <Flex row justifyContent="center" alignItems="center">
        <Text variant="body2">{title}</Text>
        <Flex row position="absolute" right="0" justifyContent="flex-end" alignItems="center" gap="10px">
          <ModalCloseIcon onClose={onClose} role="none" />
        </Flex>
      </Flex>
      <Flex>
        <SendForm {...rest} />
      </Flex>
    </Flex>
  )
}
