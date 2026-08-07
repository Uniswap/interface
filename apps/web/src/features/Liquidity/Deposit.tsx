import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SlippageWarningModal'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { PermissionedPoolBanner } from '~/components/PermissionedPool/PermissionedPoolBanner'
import { VerifyIdentityModal } from '~/components/PermissionedPool/VerifyIdentityModal'
import { BlockedTokensErrorCallout } from '~/features/Liquidity/BlockedTokensErrorCallout'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { DepositInputForm } from '~/features/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from '~/features/Liquidity/hooks/useDependentAmountFallback'
import { LowLPSlippageWarning } from '~/features/Liquidity/LowLPSlippageWarning'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useLPPermissionedGating } from '~/features/Liquidity/usePermissionedLP'
import { getPriceDifference } from '~/features/Liquidity/utils/getPriceDifference'
import { getFieldsDisabled, isInvalidRange } from '~/features/Liquidity/utils/priceRangeInfo'
import { useAccount } from '~/hooks/useAccount'
import { useModalState } from '~/hooks/useModalState'
import { ConfirmCreatePositionModal } from '~/pages/CreatePosition/ConfirmCreatePositionModal'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { CreatePositionErrorCallout } from '~/pages/CreatePosition/CreatePositionErrorCallout'
import { CreatePositionModal } from '~/pages/CreatePosition/CreatePositionModal'
import { useCreatePositionTxContext } from '~/pages/CreatePosition/CreatePositionTxContext'
import { PositionField } from '~/types/position'

export const DepositStep = () => {
  const {
    priceRangeState: { initialPrice, priceInverted },
    protocolVersion,
    creatingPoolOrPair,
    currencies,
    ticks,
    poolOrPair,
    depositState,
    setDepositState,
    refetch,
  } = useCreateLiquidityContext()

  const { t } = useTranslation()
  const { onConnectWallet } = useUniswapContext()
  const account = useAccount()
  const { TOKEN0: gatingToken0, TOKEN1: gatingToken1 } = currencies.display
  // A deep link can land a user directly on the deposit step, skipping the select-tokens step,
  // so the allowlist-based Verify Identity gate is resolved here.
  const {
    isPermissionedAndNotAllowlisted: showVerifyIdentity,
    isLoading: isPermissionCheckLoading,
    permissionedTokenSymbol,
    permissionedConfig,
  } = useLPPermissionedGating({ token0: gatingToken0, token1: gatingToken1 })
  const { isGeoRestricted, restrictedTokenSymbol, unavailableLabel } = useLPGeoRestriction({
    token0: gatingToken0,
    token1: gatingToken1,
  })
  const { openModal: openVerifyIdentityModal } = useModalState(ModalName.VerifyIdentity)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSlippageWarningModalOpen, setIsSlippageWarningModalOpen] = useState(false)
  const { customSlippageTolerance, slippageWarningModalSeen } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    slippageWarningModalSeen: s.slippageWarningModalSeen,
  }))
  const { setSlippageWarningModalSeen } = useTransactionSettingsActions()
  const { TOKEN0, TOKEN1 } = currencies.display
  const { exactField } = depositState

  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: currencies.display.TOKEN0,
      [PositionField.TOKEN1]: currencies.display.TOKEN1,
    },
    // V2 create flow doesn't show the liquidity range chart so we always want
    // to get the default initial price for DisplayCurrentPrice in deposit step
    skip: !creatingPoolOrPair && protocolVersion === ProtocolVersion.V2,
  })

  const priceDifference = useMemo(
    () =>
      getPriceDifference({
        initialPrice,
        defaultInitialPrice,
        priceInverted,
      }),
    [initialPrice, defaultInitialPrice, priceInverted],
  )

  const invalidRange = protocolVersion !== ProtocolVersion.V2 && isInvalidRange(ticks[0], ticks[1])

  const {
    txInfo,
    gasFeeEstimateUSD,
    dependentAmount,
    transactionError,
    setTransactionError,
    currencyAmounts,
    inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    preEstimatedGasFee,
  } = useCreatePositionTxContext()

  const handleUserInput = (field: PositionField, newValue: string) => {
    setDepositState((prev) => ({
      exactField: field,
      exactAmounts: {
        ...prev.exactAmounts,
        [field]: newValue,
      },
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setDepositState((prev) => ({
      exactField: field,
      exactAmounts: {
        ...prev.exactAmounts,
        [field]: amount,
      },
    }))
  }

  const openReviewModal = useCallback(() => {
    if (
      customSlippageTolerance !== undefined &&
      customSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE &&
      !slippageWarningModalSeen
    ) {
      setIsSlippageWarningModalOpen(true)
      return
    }

    setIsReviewModalOpen(true)
  }, [customSlippageTolerance, slippageWarningModalSeen])

  const handleReview = useCallback(() => {
    if (priceDifference?.warning === WarningSeverity.High) {
      setIsConfirmModalOpen(true)
      return
    }

    openReviewModal()
  }, [priceDifference?.warning, openReviewModal])

  const handleConnectEvmWallet = useCallback(() => {
    onConnectWallet?.(Platform.EVM)
  }, [onConnectWallet])

  const { TOKEN0: deposit0Disabled, TOKEN1: deposit1Disabled } = getFieldsDisabled({
    ticks,
    poolOrPair,
  })

  const {
    updatedFormattedAmounts,
    updatedCurrencyAmounts,
    updatedUSDAmounts,
    updatedDeposit0Disabled,
    updatedDeposit1Disabled,
  } = useUpdatedAmountsFromDependentAmount({
    token0: TOKEN0,
    token1: TOKEN1,
    dependentAmount,
    exactField,
    currencyAmounts,
    currencyAmountsUSDValue,
    formattedAmounts,
    deposit0Disabled,
    deposit1Disabled,
  })

  useEffect(() => {
    if (deposit1Disabled) {
      setDepositState({ exactField: PositionField.TOKEN0, exactAmounts: {} })
    } else if (deposit0Disabled) {
      setDepositState({ exactField: PositionField.TOKEN1, exactAmounts: {} })
    }
  }, [deposit0Disabled, deposit1Disabled, setDepositState])

  // Blocks creation when deep-linked straight to this step with a blocked token, bypassing the select-tokens step.
  const { hasBlockedToken, blockedTokenSymbols } = useBlockedTokens(TOKEN0, TOKEN1)

  const verifyIdentityModalProps = useMemo(
    () =>
      showVerifyIdentity
        ? {
            tokenSymbol: permissionedTokenSymbol ?? '',
            registrationUrl: permissionedConfig?.registrationUrl,
            issuer: permissionedConfig?.issuer,
          }
        : undefined,
    [showVerifyIdentity, permissionedConfig, permissionedTokenSymbol],
  )

  if (!TOKEN0 || !TOKEN1) {
    return null
  }

  const disabled = !!inputError || !txInfo?.txRequest || hasBlockedToken

  const requestLoading = Boolean(
    !transactionError &&
    !inputError &&
    !txInfo?.txRequest &&
    currencyAmounts?.TOKEN0 &&
    currencyAmounts.TOKEN1 &&
    !invalidRange,
  )

  return (
    <>
      {invalidRange ? null : (
        <Flex gap={32}>
          <Flex gap="$spacing4">
            <Text variant="subheading1">{t('common.depositTokens')}</Text>
            <Text variant="body3" color="$neutral2">
              {t('position.deposit.description')}
            </Text>
          </Flex>
        </Flex>
      )}
      <DepositInputForm
        autofocus={false}
        token0={TOKEN0}
        token1={TOKEN1}
        formattedAmounts={updatedFormattedAmounts ?? formattedAmounts}
        currencyAmounts={updatedCurrencyAmounts ?? currencyAmounts}
        currencyAmountsUSDValue={updatedUSDAmounts ?? currencyAmountsUSDValue}
        currencyBalances={currencyBalances}
        onUserInput={handleUserInput}
        onSetMax={handleOnSetMax}
        deposit0Disabled={updatedDeposit0Disabled}
        deposit1Disabled={updatedDeposit1Disabled}
        amount0Loading={requestLoading && exactField === PositionField.TOKEN1}
        amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
        actualGasFee={preEstimatedGasFee}
      />
      <LowLPSlippageWarning
        isNativePool={Boolean(currencies.sdk.TOKEN0?.isNative || currencies.sdk.TOKEN1?.isNative)}
      />
      <DepositGateBanners
        isGeoRestricted={isGeoRestricted}
        restrictedTokenSymbol={restrictedTokenSymbol}
        blockedTokenSymbols={blockedTokenSymbols}
        showVerifyIdentity={showVerifyIdentity}
        permissionedTokenSymbol={permissionedTokenSymbol}
      />
      <Flex row>
        <DepositCta
          isConnected={!!account.isConnected}
          isGeoRestricted={isGeoRestricted}
          geoUnavailableLabel={unavailableLabel}
          showVerifyIdentity={showVerifyIdentity}
          isPermissionCheckLoading={isPermissionCheckLoading}
          onConnectWallet={handleConnectEvmWallet}
          onVerifyIdentity={openVerifyIdentityModal}
          onReview={handleReview}
          disabled={disabled}
          requestLoading={requestLoading}
          inputError={inputError}
        />
      </Flex>
      <CreatePositionErrorCallout onPress={refetch} suppressed={showVerifyIdentity || isGeoRestricted} />
      <DepositFooterModals
        createPositionModalProps={{
          formattedAmounts: updatedFormattedAmounts,
          currencyAmounts: updatedCurrencyAmounts ?? currencyAmounts,
          currencyAmountsUSDValue: updatedUSDAmounts,
          gasFeeEstimateUSD,
          txInfo,
          isOpen: isReviewModalOpen,
          transactionError,
          setTransactionError,
          onClose: () => setIsReviewModalOpen(false),
        }}
        confirmModalProps={
          priceDifference?.warning === WarningSeverity.High
            ? {
                isOpen: isConfirmModalOpen,
                onClose: () => setIsConfirmModalOpen(false),
                onContinue: () => {
                  setIsConfirmModalOpen(false)
                  openReviewModal()
                },
                priceDifference,
              }
            : undefined
        }
        slippageWarningModalProps={{
          isOpen: isSlippageWarningModalOpen,
          onClose: () => setIsSlippageWarningModalOpen(false),
          onContinue: () => {
            setIsSlippageWarningModalOpen(false)
            setSlippageWarningModalSeen(true)
            setIsReviewModalOpen(true)
          },
        }}
        verifyIdentityModalProps={verifyIdentityModalProps}
      />
    </>
  )
}

type DepositFooterModalsProps = {
  createPositionModalProps: React.ComponentProps<typeof CreatePositionModal>
  confirmModalProps: React.ComponentProps<typeof ConfirmCreatePositionModal> | undefined
  slippageWarningModalProps: React.ComponentProps<typeof SlippageWarningModal>
  verifyIdentityModalProps: React.ComponentProps<typeof VerifyIdentityModal> | undefined
}

function DepositFooterModals({
  createPositionModalProps,
  confirmModalProps,
  slippageWarningModalProps,
  verifyIdentityModalProps,
}: DepositFooterModalsProps): JSX.Element {
  return (
    <>
      <CreatePositionModal {...createPositionModalProps} />
      {confirmModalProps && <ConfirmCreatePositionModal {...confirmModalProps} />}
      <SlippageWarningModal {...slippageWarningModalProps} />
      {verifyIdentityModalProps && <VerifyIdentityModal {...verifyIdentityModalProps} />}
    </>
  )
}

type DepositGateBannersProps = {
  isGeoRestricted: boolean
  restrictedTokenSymbol: string | undefined
  blockedTokenSymbols: string[]
  showVerifyIdentity: boolean
  permissionedTokenSymbol: string | undefined
}

/**
 * The blocked-state banners for the deposit step: at most one shows, and it owns the message.
 * The geo block replaces the token-safety and Verify Identity banners rather than stacking with
 * them, since neither a safety warning nor identity verification changes a region block's outcome.
 */
function DepositGateBanners({
  isGeoRestricted,
  restrictedTokenSymbol,
  blockedTokenSymbols,
  showVerifyIdentity,
  permissionedTokenSymbol,
}: DepositGateBannersProps): JSX.Element {
  if (isGeoRestricted) {
    return <LPGeoRestrictionBanner tokenSymbol={restrictedTokenSymbol} />
  }
  return (
    <>
      <BlockedTokensErrorCallout blockedTokenSymbols={blockedTokenSymbols} />
      {showVerifyIdentity && <PermissionedPoolBanner tokenSymbol={permissionedTokenSymbol ?? ''} />}
    </>
  )
}

type DepositCtaProps = {
  isConnected: boolean
  isGeoRestricted: boolean
  geoUnavailableLabel: string
  showVerifyIdentity: boolean
  isPermissionCheckLoading: boolean
  onConnectWallet: () => void
  onVerifyIdentity: () => void
  onReview: () => void
  disabled: boolean
  requestLoading: boolean
  inputError: React.ReactNode
}

function DepositCta({
  isConnected,
  isGeoRestricted,
  geoUnavailableLabel,
  showVerifyIdentity,
  isPermissionCheckLoading,
  onConnectWallet,
  onVerifyIdentity,
  onReview,
  disabled,
  requestLoading,
  inputError,
}: DepositCtaProps): JSX.Element {
  const { t } = useTranslation()
  // Outranks the connect-wallet CTA: the block holds while disconnected, so don't repurpose the
  // button into "connect wallet" for a pair the user can never LP (mirrors useIsSwapButtonDisabled).
  if (isGeoRestricted) {
    return (
      <Button size="large" disabled key="Position-Create-GeoRestrictedButton">
        {geoUnavailableLabel}
      </Button>
    )
  }
  if (!isConnected) {
    return (
      <Button size="large" variant="branded" emphasis="secondary" onPress={onConnectWallet}>
        {t('common.connectWallet.button')}
      </Button>
    )
  }
  if (showVerifyIdentity) {
    return (
      <Button
        size="large"
        variant="default"
        emphasis="primary"
        onPress={onVerifyIdentity}
        icon={<ExternalLink size="$icon.20" />}
        iconPosition="after"
        key="Position-Create-VerifyIdentityButton"
      >
        {t('permissionedPool.verifyIdentity.cta')}
      </Button>
    )
  }
  return (
    <Button
      size="large"
      variant="branded"
      onPress={onReview}
      disabled={disabled || isPermissionCheckLoading}
      key="Position-Create-DepositButton"
      loading={requestLoading || isPermissionCheckLoading}
    >
      {inputError ? inputError : t('swap.button.review')}
    </Button>
  )
}
