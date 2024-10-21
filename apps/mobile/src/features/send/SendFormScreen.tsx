import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import Animated from 'react-native-reanimated'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { SendFormButton } from 'src/features/send/SendFormButton'
import { SendHeader } from 'src/features/send/SendHeader'
import { SendTokenForm } from 'src/features/send/SendTokenForm'
import { SEND_CONTENT_RENDER_DELAY_MS } from 'src/features/send/constants'
import { Flex, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendFormScreen(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)
  useEffect(() => {
    setTimeout(() => setHideContent(false), SEND_CONTENT_RENDER_DELAY_MS)
  }, [])

  return <SendFormScreenContent hideContent={hideContent} />
}

function SendFormScreenContent({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { showRecipientSelector, recipient, derivedSendInfo, updateSendForm } = useSendContext()
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const onSelectRecipient = useCallback(
    (newRecipient: string) => {
      updateSendForm({ recipient: newRecipient, showRecipientSelector: false })
    },
    [updateSendForm],
  )

  const onHideRecipientSelector = useCallback(() => {
    updateSendForm({ showRecipientSelector: false })
  }, [updateSendForm])

  // Renders recipient select within a bottom sheet, only used when a recipient already exists. If no recipient
  // a full screen select view is rendered within `SendFlow`
  const showRecipientSelectBottomSheet = recipient && showRecipientSelector

  return (
    <>
      <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={[bottomSheetViewStyles]}>
        {showRecipientSelectBottomSheet && (
          <Modal
            fullScreen
            backgroundColor={colors.surface1.val}
            name={ModalName.TokenSelector}
            snapPoints={['65%', '100%']}
            onClose={onHideRecipientSelector}
          >
            <Flex fill px="$spacing16">
              <RecipientSelect
                chainId={derivedSendInfo.chainId as UniverseChainId}
                focusInput={showRecipientSelector}
                hideBackButton={true}
                recipient={recipient}
                renderedInModal={true}
                onHideRecipientSelector={onHideRecipientSelector}
                onSelectRecipient={onSelectRecipient}
              />
            </Flex>
          </Modal>
        )}

        {!hideContent && (
          <>
            <SendHeader flowName={t('send.title')} setShowViewOnlyModal={setShowViewOnlyModal} />
            <SendFormContent setShowViewOnlyModal={setShowViewOnlyModal} showViewOnlyModal={showViewOnlyModal} />
          </>
        )}
      </TransactionModalInnerContainer>
      <TransactionModalFooterContainer>
        <SendFormButton setShowViewOnlyModal={setShowViewOnlyModal} />
      </TransactionModalFooterContainer>
    </>
  )
}

export function SendFormContent({
  showViewOnlyModal,
  setShowViewOnlyModal,
}: {
  showViewOnlyModal: boolean
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { selectingCurrencyField, onSelectCurrency, updateSendForm } = useSendContext()

  const onHideTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: undefined })
  }, [updateSendForm])

  return (
    <>
      <WarningModal
        caption={t('send.warning.viewOnly.message')}
        acknowledgeText={t('common.button.dismiss')}
        icon={<EyeIcon color={colors.neutral2.get()} height={iconSizes.icon24} width={iconSizes.icon24} />}
        isOpen={showViewOnlyModal}
        modalName={ModalName.SwapWarning}
        severity={WarningSeverity.Low}
        title={t('send.warning.viewOnly.title')}
        onClose={(): void => setShowViewOnlyModal(false)}
        onAcknowledge={(): void => setShowViewOnlyModal(false)}
      />

      <TouchableWithoutFeedback>
        <Flex fill>
          <Animated.View style={{ position: 'absolute', height: '100%', width: '100%' }}>
            <SendTokenForm />
          </Animated.View>
        </Flex>
      </TouchableWithoutFeedback>
      {!!selectingCurrencyField && (
        <TokenSelectorModal
          isModalOpen
          activeAccountAddress={activeAccountAddress}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Send}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}
