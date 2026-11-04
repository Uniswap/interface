import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { isMobileWeb } from '@universe/environment'
import { Button, Flex, ModalCloseIcon, SpinningLoader, Text } from '@universe/mycelium'
import { BackArrow } from '@universe/mycelium/icons/BackArrow'
import { Plus } from '@universe/mycelium/icons/Plus'
import { Search } from '@universe/mycelium/icons/Search'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { numericInputRegex } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { LiquidityEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  useMeasuredFieldWidth,
} from '~/components/NumericalInput/LargeAmountInput'
import { StyledPercentInput, type StyledPercentInputProps } from '~/components/PercentInput'
import { FeeTierSearchRow } from '~/features/Liquidity/FeeTierSearchRow'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { useHoldToStepFeeValue } from '~/features/Liquidity/hooks/useHoldToStepFeeValue'
import { getCreatedPoolAtFeeAmount, getCreateFeeTierSearchData } from '~/features/Liquidity/utils/createFeeTiers'
import {
  calculateTickSpacingFromFeeAmount,
  getFeeTierKey,
  getSteppedFeePercent,
  isDynamicFeeTier,
  MAX_FEE_TIER_DECIMALS,
  validateFeeTier,
} from '~/features/Liquidity/utils/feeTiers'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import type { FeeTierData } from '~/types/liquidity'

// Only `flexGrow: 0` is carried over from the legacy config: `StyledPercentInput` re-sets
// `textAlign` after spreading props, and `justify-content` does nothing on an `<input>`.
function FeeTierPercentInput(props: StyledPercentInputProps): JSX.Element {
  return <StyledPercentInput flexGrow={0} {...props} />
}

const MAX_CHAR_PIXEL_WIDTH = 46
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 12

interface FeeTierSearchModalProps {
  isOpen: boolean
  onClose: () => void
  chainId?: UniverseChainId
  protocolVersion: ProtocolVersion
  hook?: string
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  selectedFee?: FeeData
  onSelectFee: (fee: FeeData) => void
  onSelectDynamicFee?: (fee: FeeData) => void
  createDescription?: string
  /** Fired when the user opens the create-fee-tier popup. Used by the launch-auction flow for analytics. */
  onCreateFeeTierClick?: () => void
  /** Fired when the user confirms a created fee tier, with the fee amount in hundredths of a bip. */
  onFeeTierCreated?: (feeAmount: number) => void
  /** Open directly in the create-fee-tier view instead of the search list. */
  initialCreateModeEnabled?: boolean
  /** When set, existing-pool tiers can't be confirmed in create mode (CCA needs a new pool): button disabled + warning. */
  blockExistingPools?: boolean
  existingPoolWarning?: string
  /** Optional "Learn more" link appended to the existing-pool warning/tooltip. */
  existingPoolWarningLearnMoreUrl?: string
}

export function FeeTierSearchModal({
  isOpen,
  onClose: onCloseProp,
  chainId,
  protocolVersion,
  hook,
  sdkCurrencies,
  selectedFee,
  onSelectFee,
  onSelectDynamicFee,
  createDescription,
  onCreateFeeTierClick,
  onFeeTierCreated,
  initialCreateModeEnabled,
  blockExistingPools,
  existingPoolWarning,
  existingPoolWarningLearnMoreUrl,
}: FeeTierSearchModalProps) {
  const onClose = () => {
    setCreateFeeValue('')
    setCreateModeEnabled(false)
    onCloseProp()
  }
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const trace = useTrace()
  const [searchValue, setSearchValue] = useState('')
  const [createFeeValue, setCreateFeeValue] = useState('')
  const [createModeEnabled, setCreateModeEnabled] = useState(false)
  const { ref: hiddenObserverRef, fieldWidth: createFeeFieldWidth } = useMeasuredFieldWidth(createFeeValue)

  const withDynamicFeeTier = Boolean(hook)

  // When blocking existing pools (CCA), also check the user-entered custom tier on-chain so an
  // abandoned/zero-liquidity pool the indexed data omits still blocks the "Create" action.
  const createFeeTierToCheck = useMemo(() => {
    const feeAmount = Math.round(parseFloat(createFeeValue) * 10000)
    if (!Number.isFinite(feeAmount) || feeAmount <= 0) {
      return undefined
    }
    return {
      isDynamic: false,
      feeAmount,
      tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount),
    }
  }, [createFeeValue])
  const additionalFeeTiersToCheck = useMemo(
    () => (createFeeTierToCheck ? [createFeeTierToCheck] : []),
    [createFeeTierToCheck],
  )

  const { feeTierData, isLoading: isFeeTierDataLoading } = useAllFeeTierPoolData({
    chainId,
    protocolVersion,
    sdkCurrencies,
    withDynamicFeeTier,
    hook: hook ?? ZERO_ADDRESS,
    checkOnChainPoolExistence: Boolean(blockExistingPools),
    additionalFeeTiersToCheck,
  })

  // While the existing-pool check is settling, withhold the create/select UI. Not CCA-only: an unsettled
  // record reads as "no pool at this fee", which is what would let the create action mint a pool beside an
  // existing one. `useAllFeeTierPoolData` keeps this set on a failed read too, so an unverifiable tier
  // stays gated rather than being created blind.
  const isExistingPoolCheckLoading = isFeeTierDataLoading

  // The v4 create flow defaults to the new canonical tiers (an old tier stays only when its pool is
  // deep). Mirror that here so the search list matches the inline selector. CCA (blockExistingPools)
  // keeps the canonical tiers for its brand-new-pool gating.
  const useNewDefaultFeeTiers = protocolVersion === ProtocolVersion.V4 && !blockExistingPools
  const displayedFeeTiers = useMemo(
    () =>
      getCreateFeeTierSearchData({
        useNewDefaultFeeTiers,
        feeTierData,
        formatPercent,
        hook,
        selectedFee,
      }),
    [useNewDefaultFeeTiers, feeTierData, formatPercent, hook, selectedFee],
  )

  // Stable stepper for the +/- buttons.
  const stepFee = useEvent((current: string, direction: 'up' | 'down'): string =>
    getSteppedFeePercent(current, direction),
  )

  const { onDecrementPressIn, onIncrementPressIn, onStepPressOut } = useHoldToStepFeeValue({
    computeNext: stepFee,
    setValue: setCreateFeeValue,
  })

  // Open directly into the create view when requested (e.g. all common tiers already have pools)
  useEffect(() => {
    if (isOpen) {
      setCreateModeEnabled(initialCreateModeEnabled ?? false)
    }
  }, [isOpen, initialCreateModeEnabled])

  const feeHundredthsOfBips = Math.round(parseFloat(createFeeValue) * 10000)

  // The deployed pool at the typed fee, at whatever tick spacing it carries — matched on fee amount alone
  // because a key built from `calculateTickSpacingFromFeeAmount` names a different pool than one created
  // under the old 2x schedule. Confirming resolves to this pool rather than a synthesized tier, so the
  // typed fee can't mint an empty pool beside a deep one at the same fee.
  const existingPoolForCreateFee = getCreatedPoolAtFeeAmount({ feeTierData, feeAmount: feeHundredthsOfBips })
  const feeTierAlreadyExists = Boolean(existingPoolForCreateFee)
  // CCA requires a brand-new pool, so any pool at the fee amount blocks — the same rule the tier grid
  // applies via `getCommonFeeTiersWithData`, so neither entry point can create a second pool at a fee the
  // other already considers taken.
  const blockedByExistingPool = Boolean(blockExistingPools && feeTierAlreadyExists)

  const feeDataForCreateFee: FeeData = existingPoolForCreateFee?.fee ?? {
    isDynamic: false,
    feeAmount: feeHundredthsOfBips,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeHundredthsOfBips),
  }

  const handleSelectExistingFeeTier = useEvent((pool: FeeTierData) => {
    if (isDynamicFeeTier(pool.fee)) {
      if (onSelectDynamicFee) {
        onSelectDynamicFee(pool.fee)
      } else {
        onSelectFee(pool.fee)
      }
    } else {
      onSelectFee({ isDynamic: pool.fee.isDynamic, feeAmount: pool.fee.feeAmount, tickSpacing: pool.fee.tickSpacing })
    }
    onClose()
  })

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
  })
  useEffect(() => {
    if (createFeeValue) {
      onSetFontSize(createFeeValue)
    } else {
      onSetFontSize('0')
    }
  }, [onSetFontSize, createFeeValue])

  return (
    <Modal
      name={ModalName.FeeTierSearch}
      onClose={onClose}
      isDismissible
      isModalOpen={isOpen}
      paddingX="$spacing8"
      paddingY="$spacing16"
      maxWidth={404}
    >
      <Flex width="100%" gap="$gap20">
        <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%">
          {createModeEnabled && (
            <Flex {...ClickableTamaguiStyle} onPress={() => setCreateModeEnabled(false)}>
              <BackArrow size="$icon.24" color="$neutral2" />
            </Flex>
          )}
          <Text
            variant="body2"
            flexGrow={1}
            textAlign={createModeEnabled || isMobileWeb ? 'center' : 'left'}
            pl={createModeEnabled ? 0 : 8}
          >
            {createModeEnabled ? t('fee.tier.create') : t('fee.tier.select')}
          </Text>
          <ModalCloseIcon testId="LiquidityModalHeader-close" onClose={onClose} />
        </Flex>

        {createModeEnabled ? (
          <Flex gap="$gap20">
            <Text variant="body2" color="$neutral2" textAlign="center">
              {/* The default copy promises a new pool; say so plainly when the typed fee resolves to an
                  existing one instead. CCA keeps its own copy — a blocking warning renders below. */}
              {feeTierAlreadyExists && !blockExistingPools
                ? t('fee.tier.create.existing.description')
                : (createDescription ?? t('fee.tier.create.description'))}
            </Text>
            <Flex row alignItems="center" gap="$spacing28" px="$spacing20">
              <Flex
                justifyContent="center"
                alignItems="center"
                backgroundColor="$surface3"
                borderRadius="$roundedFull"
                userSelect="none"
                height="$spacing36"
                width="$spacing36"
                onPressIn={onDecrementPressIn}
                onPressOut={onStepPressOut}
                onPress={() => setCreateFeeValue((prev) => stepFee(prev, 'down'))}
                {...ClickableTamaguiStyle}
              >
                <Text variant="heading3" mb="$spacing4">
                  -
                </Text>
              </Flex>
              <Flex flex={1} justifyContent="flex-end">
                <Flex row alignSelf="center" maxWidth="100%" centered onLayout={onLayout} minHeight="84px">
                  <FeeTierPercentInput
                    value={createFeeValue}
                    onUserInput={(input) => {
                      setCreateFeeValue(validateFeeTier(input))
                    }}
                    placeholder="0"
                    maxDecimals={MAX_FEE_TIER_DECIMALS}
                    numericalFontSize={fontSize}
                    fieldWidth={createFeeFieldWidth}
                  />
                  <NumericalInputSymbolContainer showPlaceholder={!createFeeValue} numericalFontSize={fontSize}>
                    %
                  </NumericalInputSymbolContainer>
                  <NumericalInputMimic ref={hiddenObserverRef} numericalFontSize={fontSize}>
                    {createFeeValue}
                  </NumericalInputMimic>
                </Flex>
              </Flex>
              <Flex
                justifyContent="center"
                alignItems="center"
                backgroundColor="$surface3"
                borderRadius="$roundedFull"
                userSelect="none"
                height={36}
                width={36}
                onPressIn={onIncrementPressIn}
                onPressOut={onStepPressOut}
                onPress={() => setCreateFeeValue((prev) => stepFee(prev, 'up'))}
                {...ClickableTamaguiStyle}
              >
                <Text variant="heading3">+</Text>
              </Flex>
            </Flex>
            {blockedByExistingPool && existingPoolWarning && (
              <Text variant="body3" color="$statusCritical" textAlign="center">
                {existingPoolWarning}
              </Text>
            )}
            {/* TODO(WEB-4920): search existing fee tiers for close matches and optionally similar list */}
            <Flex row>
              <Button
                variant="default"
                disabled={
                  !createFeeValue || createFeeValue === '' || blockedByExistingPool || isExistingPoolCheckLoading
                }
                loading={isExistingPoolCheckLoading && Boolean(createFeeValue)}
                onPress={() => {
                  onSelectFee(feeDataForCreateFee)
                  sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
                    action: FeePoolSelectAction.Search,
                    fee_tier: feeHundredthsOfBips,
                    is_new_fee_tier: !feeTierAlreadyExists,
                    ...trace,
                  })
                  if (!feeTierAlreadyExists) {
                    onFeeTierCreated?.(feeHundredthsOfBips)
                  }
                  onClose()
                }}
              >
                {blockExistingPools
                  ? t('fee.tier.create')
                  : feeTierAlreadyExists
                    ? t('fee.tier.select.existing.button')
                    : t('fee.tier.create.button')}
              </Button>
            </Flex>
          </Flex>
        ) : (
          <>
            <Flex
              row
              alignItems="center"
              py="$padding12"
              px="$padding8"
              backgroundColor="$surface2"
              borderRadius="$rounded24"
              gap="$gap8"
              mx="$spacing8"
            >
              <Search size="$icon.20" color="$neutral2" />
              <AmountInput
                width="100%"
                autoFocus
                alignSelf="stretch"
                backgroundColor="$transparent"
                borderRadius={0}
                borderWidth="$none"
                textAlign="left"
                value={searchValue}
                fontFamily="$subHeading"
                fontSize={18}
                px="$none"
                py="$none"
                placeholder={t('fee.tier.search.short')}
                placeholderTextColor="$neutral3"
                onChangeText={(value) => {
                  if (value === '.') {
                    setSearchValue('0.')
                    return
                  }
                  // Prevent two decimals
                  if (value.indexOf('.') !== -1 && value.indexOf('.', value.indexOf('.') + 1) !== -1) {
                    return
                  }
                  // Prevent addition of non-numeric characters to the end of the string
                  if (!numericInputRegex.test(value)) {
                    setSearchValue(value.slice(0, -1))
                    return
                  }

                  const validFeeTier = validateFeeTier(value)
                  if (validFeeTier !== value) {
                    setSearchValue(validFeeTier)
                    return
                  }

                  setSearchValue(Number(validFeeTier) >= 0 ? validFeeTier : '')
                }}
              />
            </Flex>
            <Flex
              width="100%"
              gap="$gap4"
              maxHeight={350}
              overflow="scroll"
              px="$spacing16"
              className="scrollbar-hidden"
            >
              {isExistingPoolCheckLoading ? (
                <Flex centered py="$spacing24" width="100%">
                  <SpinningLoader color="$neutral2" />
                </Flex>
              ) : (
                displayedFeeTiers
                  .filter(
                    (data) => data.formattedFee.includes(searchValue) || (data.id && searchValue.includes(data.id)),
                  )
                  .map((pool) => (
                    <FeeTierSearchRow
                      key={pool.id + pool.formattedFee}
                      pool={pool}
                      blocked={Boolean(blockExistingPools && pool.created)}
                      isSelected={
                        getFeeTierKey({ feeTier: pool.fee.feeAmount, tickSpacing: pool.fee.tickSpacing }) ===
                        getFeeTierKey({ feeTier: selectedFee?.feeAmount, tickSpacing: selectedFee?.tickSpacing })
                      }
                      existingPoolWarning={existingPoolWarning}
                      existingPoolWarningLearnMoreUrl={existingPoolWarningLearnMoreUrl}
                      onSelect={handleSelectExistingFeeTier}
                    />
                  ))
              )}
            </Flex>
            <Flex gap="$gap12" alignItems="center" $sm={{ pb: '$spacing12' }}>
              <Text variant="body3" color="$neutral2">
                {t('fee.tier.missing.description')}
              </Text>
              <Button
                emphasis="secondary"
                size="small"
                fill={false}
                icon={<Plus size={16} color="$neutral1" />}
                onPress={() => {
                  onCreateFeeTierClick?.()
                  setCreateModeEnabled(true)
                }}
              >
                {t('fee.tier.create.button')}
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Modal>
  )
}
