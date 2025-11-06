import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useAccount } from 'hooks/useAccount'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSendContext } from 'state/send/SendContext'
import { ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { Button, Flex, Separator, styled } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { selectHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/selectors'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/modals/LowNativeBalanceModal'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const ReviewContentContainer = styled(Flex, {
  width: '100%',
  gap: '$gap16',
})

const SendModalHeader = ({
  label,
  header,
  subheader,
  image,
}: {
  label?: ReactNode
  header: ReactNode
  subheader: ReactNode
  image: ReactNode
}) => {
  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <Flex gap="$gap4">
        {label && (
          <ThemedText.BodySmall color="neutral2" lineHeight="20px">
            {label}
          </ThemedText.BodySmall>
        )}
        <ThemedText.HeadlineLarge lineHeight="44px">{header}</ThemedText.HeadlineLarge>
        <ThemedText.BodySmall lineHeight="20px" color="neutral2">
          {subheader}
        </ThemedText.BodySmall>
      </Flex>
      <Flex height={36}>{image}</Flex>
    </Flex>
  )
}

type SendModalInnerProps = {
  onConfirm: () => void
  onDismiss: () => void
  isConfirming?: boolean
}

export type SendModalProps = SendModalInnerProps & {
  isOpen: boolean
}

export function SendReviewModalInner({ onConfirm, isConfirming }: SendModalInnerProps) {
  const { t } = useTranslation()
  const { chainId } = useMultichainContext()
  const account = useAccount()

  const {
    value: showMaxTransferModal,
    setTrue: handleShowMaxTransferModal,
    setFalse: handleHideMaxTransferModal,
  } = useBooleanState(false)

  const { needsPasskeySignin } = useGetPasskeyAuthStatus(account.connector?.id)

  const {
    sendState: { inputCurrency, inputInFiat, exactAmountFiat },
    derivedSendInfo: { parsedTokenAmount, exactAmountOut, gasFeeCurrencyAmount, recipientData, currencyBalance },
  } = useSendContext()
  const hasDismissedLowNetworkTokenWarning = useSelector(selectHasDismissedLowNetworkTokenWarning)

  const activeCurrency = useAppFiatCurrency()
  const { formatNumberOrString, formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()

  const formattedInputAmount = formatCurrencyAmount({
    value: parsedTokenAmount,
    type: NumberType.TokenNonTx,
  })
  const formattedFiatInputAmount = formatNumberOrString({
    value: inputInFiat ? exactAmountFiat : exactAmountOut,
    type: NumberType.PortfolioBalance,
    currencyCode: activeCurrency,
  })

  const gasFeeUSD = useUSDCValue(gasFeeCurrencyAmount)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD?.toExact(), NumberType.PortfolioBalance)

  const currencySymbolAmount = `${formattedInputAmount} ${inputCurrency?.symbol ?? inputCurrency?.name}`

  const [primaryInputView, secondaryInputView] = inputInFiat
    ? [formattedFiatInputAmount, currencySymbolAmount]
    : [currencySymbolAmount, formattedFiatInputAmount]

  const maxInputAmount = maxAmountSpend(currencyBalance)
  const isMax =
    maxInputAmount && (parsedTokenAmount?.equalTo(maxInputAmount) || parsedTokenAmount?.greaterThan(maxInputAmount))

  const handleConfirm = () => {
    if (!hasDismissedLowNetworkTokenWarning && isMax && inputCurrency?.isNative) {
      sendAnalyticsEvent(UniswapEventName.LowNetworkTokenInfoModalOpened, { location: 'send' })
      handleShowMaxTransferModal()
      return
    }
    onConfirm()
  }

  return (
    <>
      <ReviewContentContainer data-testid="send-review-modal">
        <Flex gap="$gap24" px="$spacing12">
          <SendModalHeader
            header={primaryInputView}
            subheader={secondaryInputView}
            image={
              <PortfolioLogo currencies={[inputCurrency]} size={36} chainId={chainId ?? UniverseChainId.Mainnet} />
            }
          />
          <SendModalHeader
            label={capitalize(t('common.to'))}
            header={
              recipientData?.unitag || recipientData?.ensName ? (
                <Flex row gap="$gap4" alignItems="center">
                  <ThemedText.HeadlineLarge>{recipientData.unitag ?? recipientData.ensName}</ThemedText.HeadlineLarge>
                  {recipientData.unitag && <Unitag size={18} />}
                </Flex>
              ) : (
                shortenAddress({ address: recipientData?.address })
              )
            }
            subheader={
              (recipientData?.unitag || recipientData?.ensName) && shortenAddress({ address: recipientData.address })
            }
            image={<AccountIcon address={recipientData?.address} size={36} />}
          />
        </Flex>
        <Separator />
        <Flex row alignItems="center" width="100%" justifyContent="space-between" px="$spacing12">
          <ThemedText.BodySmall color="neutral2" lineHeight="20px">
            <Trans i18nKey="common.networkCost" />
          </ThemedText.BodySmall>
          <Flex row width="min-content" gap="$gap4" alignItems="center">
            <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={16} />
            <ThemedText.BodySmall>{gasFeeFormatted}</ThemedText.BodySmall>
          </Flex>
        </Flex>
        <Trace logPress element={ElementName.SendReviewButton}>
          <Flex alignSelf="stretch" row>
            <Button
              emphasis="primary"
              variant="branded"
              size="large"
              loading={isConfirming}
              isDisabled={isConfirming}
              icon={needsPasskeySignin ? <Passkey size="$icon.24" /> : undefined}
              onPress={handleConfirm}
            >
              <Trans i18nKey="common.confirmSend.button" />
            </Button>
          </Flex>
        </Trace>
      </ReviewContentContainer>
      <LowNativeBalanceModal
        isOpen={showMaxTransferModal}
        onClose={handleHideMaxTransferModal}
        onAcknowledge={() => {
          handleHideMaxTransferModal()
          onConfirm()
        }}
      />
    </>
  )
}
