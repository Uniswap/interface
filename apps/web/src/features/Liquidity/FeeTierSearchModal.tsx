import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, Tooltip, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Plus } from 'ui/src/components/icons/Plus'
import { Search } from 'ui/src/components/icons/Search'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { numericInputRegex } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { LiquidityEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumericalInputMimic, NumericalInputSymbolContainer } from '~/components/NumericalInput/LargeAmountInput'
import { StyledPercentInput } from '~/components/PercentInput'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { useHoldToStepFeeValue } from '~/features/Liquidity/hooks/useHoldToStepFeeValue'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import {
  calculateTickSpacingFromFeeAmount,
  getFeeTierKey,
  getSteppedFeePercent,
  isDynamicFeeTier,
  MAX_FEE_TIER_DECIMALS,
  validateFeeTier,
} from '~/features/Liquidity/utils/feeTiers'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const FeeTierPercentInput = styled(StyledPercentInput, {
  flexGrow: 0,
  textAlign: 'right',
  justifyContent: 'flex-end',
})

const MAX_CHAR_PIXEL_WIDTH = 46
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 12

interface FeeTierSearchModalProps {
  isOpen: boolean
  onClose: () => void
  chainId?: number
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
  const trace = useTrace()
  const [searchValue, setSearchValue] = useState('')
  const [createFeeValue, setCreateFeeValue] = useState('')
  const [createModeEnabled, setCreateModeEnabled] = useState(false)
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const withDynamicFeeTier = Boolean(hook)
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const { feeTierData } = useAllFeeTierPoolData({
    chainId,
    protocolVersion,
    sdkCurrencies,
    withDynamicFeeTier,
    hook: hook ?? ZERO_ADDRESS,
  })

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
  const feeTierAlreadyExists = Boolean(feeTierData[feeHundredthsOfBips])
  // feeTierData is keyed by `{fee}-{tickSpacing}` (the legacy lookup above never matches); resolve the
  // full key to block existing pools in the CCA flow, which requires a brand-new pool.
  const createFeeTierKey = getFeeTierKey({
    feeTier: feeHundredthsOfBips,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeHundredthsOfBips),
  })
  const existingPoolForCreateFee = createFeeTierKey ? feeTierData[createFeeTierKey] : undefined
  const blockedByExistingPool = Boolean(blockExistingPools && existingPoolForCreateFee?.created)

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
              {createDescription ?? t('fee.tier.create.description')}
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
                    fieldWidth={createFeeValue && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                  />
                  <NumericalInputSymbolContainer showPlaceholder={!createFeeValue} numericalFontSize={fontSize}>
                    %
                  </NumericalInputSymbolContainer>
                  <NumericalInputMimic ref={hiddenObserver.ref} numericalFontSize={fontSize}>
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
                isDisabled={!createFeeValue || createFeeValue === '' || blockedByExistingPool}
                onPress={() => {
                  onSelectFee({
                    isDynamic: false,
                    feeAmount: feeHundredthsOfBips,
                    tickSpacing: calculateTickSpacingFromFeeAmount(feeHundredthsOfBips),
                  })
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
              {Object.values(feeTierData)
                .filter((data) => data.formattedFee.includes(searchValue) || (data.id && searchValue.includes(data.id)))
                .map((pool) => {
                  // Existing pools can't be used by the CCA flow — disable them with the same warning as the grid
                  const blocked = Boolean(blockExistingPools && pool.created)
                  const row = (
                    <Flex
                      row
                      alignItems="center"
                      gap="$spacing24"
                      width="100%"
                      key={pool.id + pool.formattedFee}
                      py="$padding12"
                      justifyContent="space-between"
                      opacity={blocked ? 0.54 : 1}
                      {...(blocked ? { cursor: 'default' as const } : ClickableTamaguiStyle)}
                      onPress={
                        blocked
                          ? undefined
                          : () => {
                              if (isDynamicFeeTier(pool.fee)) {
                                if (onSelectDynamicFee) {
                                  onSelectDynamicFee(pool.fee)
                                } else {
                                  onSelectFee(pool.fee)
                                }
                              } else {
                                onSelectFee({
                                  isDynamic: pool.fee.isDynamic,
                                  feeAmount: pool.fee.feeAmount,
                                  tickSpacing: pool.fee.tickSpacing,
                                })
                              }

                              onClose()
                            }
                      }
                    >
                      <Flex>
                        <Flex row alignItems="center">
                          <Text variant="subheading2">{pool.formattedFee}</Text>
                          {isLpIncentivesEnabled && pool.boostedApr !== undefined && pool.boostedApr > 0 && (
                            <Tooltip placement="right">
                              <Tooltip.Trigger>
                                <LpIncentivesAprDisplay lpIncentiveRewardApr={pool.boostedApr} isSmall ml="$spacing8" />
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                <Tooltip.Arrow />
                                <Text variant="body4" color="$neutral2" textAlign="center">
                                  {t('pool.incentives.eligibleTooltip')}
                                </Text>
                              </Tooltip.Content>
                            </Tooltip>
                          )}
                        </Flex>
                        <Flex row gap="$gap12" alignItems="center">
                          <Text variant="body3" color="$neutral2">
                            {pool.totalLiquidityUsd === 0
                              ? '0'
                              : formatNumberOrString({
                                  value: pool.totalLiquidityUsd,
                                  type: NumberType.FiatTokenStats,
                                })}{' '}
                            {t('common.totalValueLocked')}
                          </Text>
                          <Text variant="body3" color="$neutral2">
                            {pool.created
                              ? t('fee.tier.percent.select', {
                                  percentage: formatPercent(pool.percentage.toSignificant(), 3),
                                })
                              : t('common.notCreated.label')}
                          </Text>
                        </Flex>
                      </Flex>
                      {getFeeTierKey({
                        feeTier: pool.fee.feeAmount,
                        tickSpacing: pool.fee.tickSpacing,
                        isDynamicFee: pool.fee.isDynamic,
                      }) ===
                        getFeeTierKey({
                          feeTier: selectedFee?.feeAmount,
                          tickSpacing: selectedFee?.tickSpacing,
                          isDynamicFee: selectedFee?.isDynamic,
                        }) && <CheckCircleFilled size="$icon.24" color="$accent3" />}
                    </Flex>
                  )

                  if (blocked && existingPoolWarning) {
                    return (
                      <Tooltip key={pool.id + pool.formattedFee} placement="top">
                        <Tooltip.Trigger width="100%">{row}</Tooltip.Trigger>
                        {/* pointerEvents="auto" lets the Learn more link receive clicks (see DisconnectButton) */}
                        <Tooltip.Content maxWidth={280} pointerEvents="auto">
                          <Tooltip.Arrow />
                          <Flex gap="$spacing4">
                            <Text variant="body4" color="$neutral1">
                              {existingPoolWarning}
                            </Text>
                            {existingPoolWarningLearnMoreUrl && (
                              <LearnMoreLink
                                url={existingPoolWarningLearnMoreUrl}
                                textVariant="buttonLabel4"
                                textColor="$accent1"
                              />
                            )}
                          </Flex>
                        </Tooltip.Content>
                      </Tooltip>
                    )
                  }

                  return row
                })}
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
