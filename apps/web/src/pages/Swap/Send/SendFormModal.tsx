import { UniverseChainId } from '@universe/chains'
import { Flex, ModalCloseIcon, Text } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { noop } from 'utilities/src/react/noop'
import { SwapAndLimitContext } from '~/features/Swap/state/types'
import { useCurrency } from '~/hooks/Tokens'
import { SendForm, SendFormProps } from '~/pages/Swap/Send/SendForm'
import { SendContextProvider } from '~/pages/Swap/Send/state/SendContext'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

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
  const rawRecipientParam = searchParams.get('sendRecipient') ?? undefined
  const recipientParam = isEVMAddress(rawRecipientParam) ? rawRecipientParam : undefined
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
        {/*
          Without this, useMultichainContext() falls back to its default (isMultichainContext: false),
          which makes the token/network selector resolve to the wallet's currently connected chain
          instead of All Networks — this modal is opened outside the /swap page, which is the only
          other place that provides this context (SWAP-3443).
        */}
        <MultichainContextProvider initialChainId={chainId}>
          <SendContextProvider initialRecipient={recipientParam}>
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
        </MultichainContextProvider>
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
        <Flex row position="absolute" right={0} justifyContent="flex-end" alignItems="center" gap={10}>
          <ModalCloseIcon onClose={onClose} role="none" />
        </Flex>
      </Flex>
      <Flex>
        <SendForm {...rest} />
      </Flex>
    </Flex>
  )
}

export default SendFormModal
