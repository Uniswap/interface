import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutAnimation, TouchableWithoutFeedback } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { SendFormButton } from 'src/features/send/SendFormButton'
import { SendHeader } from 'src/features/send/SendHeader'
import { SendTokenForm } from 'src/features/send/SendTokenForm'
import { SEND_CONTENT_RENDER_DELAY_MS } from 'src/features/send/constants'
import { Flex, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import {
  useCommonTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForSearchResults,
} from 'uniswap/src/components/TokenSelector/hooks'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTokenWarningDismissed } from 'uniswap/src/features/tokens/slice/hooks'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import {
  useAddToSearchHistory,
  useFavoriteTokensOptions,
  useTokenSectionsForEmptySearch,
} from 'wallet/src/components/TokenSelector/hooks'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
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
                chainId={derivedSendInfo.chainId}
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
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()

  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const valueModifiers = usePortfolioValueModifiers(activeAccountAddress)
  const { registerSearch } = useAddToSearchHistory()
  const searchHistory = useSelector(selectSearchHistory)

  const { selectingCurrencyField, onSelectCurrency, updateSendForm } = useSendContext()

  const onHideTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: undefined })
  }, [updateSendForm])

  return (
    <>
      <WarningModal
        caption={t('send.warning.viewOnly.message')}
        confirmText={t('common.button.dismiss')}
        icon={<EyeIcon color={colors.neutral2.get()} height={iconSizes.icon24} width={iconSizes.icon24} />}
        isOpen={showViewOnlyModal}
        modalName={ModalName.SwapWarning}
        severity={WarningSeverity.Low}
        title={t('send.warning.viewOnly.title')}
        onClose={(): void => setShowViewOnlyModal(false)}
        onConfirm={(): void => setShowViewOnlyModal(false)}
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
          addToSearchHistoryCallback={registerSearch}
          convertFiatAmountFormattedCallback={convertFiatAmountFormatted}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Send}
          formatNumberOrStringCallback={formatNumberOrString}
          navigateToBuyOrReceiveWithEmptyWalletCallback={navigateToBuyOrReceiveWithEmptyWallet}
          searchHistory={searchHistory as TokenSearchResult[]}
          useCommonTokensOptionsHook={useCommonTokensOptions}
          useFavoriteTokensOptionsHook={useFavoriteTokensOptions}
          useFilterCallbacksHook={useFilterCallbacks}
          usePopularTokensOptionsHook={usePopularTokensOptions}
          usePortfolioTokenOptionsHook={usePortfolioTokenOptions}
          useTokenSectionsForEmptySearchHook={useTokenSectionsForEmptySearch}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResults}
          useTokenWarningDismissedHook={useTokenWarningDismissed}
          valueModifiers={valueModifiers}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onDismiss={() => Keyboard.dismiss()}
          onPressAnimation={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}
