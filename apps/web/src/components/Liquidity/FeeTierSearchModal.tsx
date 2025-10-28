import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAllFeeTierPoolData } from 'components/Liquidity/hooks/useAllFeeTierPoolData'
import {
  calculateTickSpacingFromFeeAmount,
  getFeeTierKey,
  isDynamicFeeTier,
  MAX_FEE_TIER_DECIMALS,
  validateFeeTier,
} from 'components/Liquidity/utils/feeTiers'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { StyledPercentInput } from 'components/PercentInput'
import ms from 'ms'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { NumericalInputMimic, NumericalInputSymbolContainer } from 'pages/Swap/common/shared'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
// biome-ignore lint/style/noRestrictedImports: styled-components needed for custom component styling
import styled from 'styled-components'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Button, Flex, ModalCloseIcon, Text } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Plus } from 'ui/src/components/icons/Plus'
import { Search } from 'ui/src/components/icons/Search'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { numericInputRegex } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isMobileWeb } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const FeeTierPercentInput = styled(StyledPercentInput)`
  flex-grow: 0;
  text-align: end;
  justify-content: flex-end;
`

const MAX_CHAR_PIXEL_WIDTH = 46
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 12

const SMALLEST_BIP_AMOUNT = 0.0001

export function FeeTierSearchModal() {
  const { chainId } = useMultichainContext()
  const {
    positionState: { fee: selectedFee, protocolVersion, hook },
    currencies,
    setPositionState,
    feeTierSearchModalOpen,
    setFeeTierSearchModalOpen,
    setDynamicFeeTierSpeedbumpData,
  } = useCreateLiquidityContext()
  const onClose = () => {
    setCreateFeeValue('')
    setCreateModeEnabled(false)
    setFeeTierSearchModalOpen(false)
  }
  const { t } = useTranslation()
  const trace = useTrace()
  const [searchValue, setSearchValue] = useState('')
  const [createFeeValue, setCreateFeeValue] = useState('')
  const [createModeEnabled, setCreateModeEnabled] = useState(false)
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const [autoDecrementing, setAutoDecrementing] = useState(false)
  const [autoIncrementing, setAutoIncrementing] = useState(false)
  const [holdDuration, setHoldDuration] = useState(0)
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const withDynamicFeeTier = Boolean(hook)
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const { feeTierData } = useAllFeeTierPoolData({
    chainId,
    protocolVersion,
    sdkCurrencies: currencies.sdk,
    withDynamicFeeTier,
    hook: hook ?? ZERO_ADDRESS,
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    let holdTimeout: NodeJS.Timeout
    const baseInterval = 100
    let currentInterval = baseInterval

    if (autoDecrementing || autoIncrementing) {
      holdTimeout = setTimeout(() => {
        setHoldDuration((prev) => prev + 1)
      }, ms('1s'))

      if (holdDuration >= 2) {
        currentInterval = baseInterval / 2
      }
      if (holdDuration >= 4) {
        currentInterval = baseInterval / 4
      }
      if (holdDuration >= 6) {
        currentInterval = baseInterval / 8
      }

      interval = setInterval(() => {
        setCreateFeeValue((prev) => {
          let newValue = parseFloat(prev)
          if (autoDecrementing) {
            if (!prev || prev === '') {
              return '0'
            }
            newValue -= SMALLEST_BIP_AMOUNT
            if (newValue < 0) {
              return '0'
            }
          } else if (autoIncrementing) {
            if (!prev || prev === '') {
              return SMALLEST_BIP_AMOUNT.toString()
            }
            newValue += SMALLEST_BIP_AMOUNT
            return validateFeeTier(newValue.toFixed(MAX_FEE_TIER_DECIMALS))
          }
          return newValue.toFixed(MAX_FEE_TIER_DECIMALS)
        })
      }, currentInterval)

      return () => {
        clearInterval(interval)
        clearTimeout(holdTimeout)
      }
    }

    return () => {
      clearInterval(interval)
      clearTimeout(holdTimeout)
      setHoldDuration(0) // Reset hold duration on release
    }
  }, [autoDecrementing, autoIncrementing, holdDuration])

  const feeHundredthsOfBips = Math.round(parseFloat(createFeeValue) * 10000)

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
      isModalOpen={feeTierSearchModalOpen}
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
              {t('fee.tier.create.description')}
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
                onPressIn={() => {
                  setAutoDecrementing(true)
                }}
                onPressOut={() => {
                  setAutoDecrementing(false)
                }}
                onPress={() => {
                  setCreateFeeValue((prev) => {
                    if (!prev || prev === '') {
                      return '0'
                    }
                    const newValue = parseFloat(prev) - SMALLEST_BIP_AMOUNT
                    if (isNaN(newValue) || newValue < 0) {
                      return '0'
                    }
                    return newValue.toFixed(MAX_FEE_TIER_DECIMALS)
                  })
                }}
                {...ClickableTamaguiStyle}
              >
                <Text variant="heading3" mb="$spacing4">
                  -
                </Text>
              </Flex>
              <Flex flex={1} justifyContent="flex-end">
                <Flex row maxWidth="100%" centered onLayout={onLayout} minHeight="84px">
                  <FeeTierPercentInput
                    value={createFeeValue}
                    onUserInput={(input) => {
                      setCreateFeeValue(validateFeeTier(input))
                    }}
                    placeholder="0"
                    maxDecimals={MAX_FEE_TIER_DECIMALS}
                    $fontSize={fontSize}
                    $width={createFeeValue && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                  />
                  <NumericalInputSymbolContainer showPlaceholder={!createFeeValue} $fontSize={fontSize}>
                    %
                  </NumericalInputSymbolContainer>
                  <NumericalInputMimic ref={hiddenObserver.ref} $fontSize={fontSize}>
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
                onPressIn={() => {
                  setAutoIncrementing(true)
                }}
                onPressOut={() => {
                  setAutoIncrementing(false)
                }}
                onPress={() => {
                  setCreateFeeValue((prev) => {
                    if (!prev || prev === '') {
                      return SMALLEST_BIP_AMOUNT.toString()
                    }
                    const newValue = parseFloat(prev) + SMALLEST_BIP_AMOUNT
                    return validateFeeTier(newValue.toFixed(MAX_FEE_TIER_DECIMALS))
                  })
                }}
                {...ClickableTamaguiStyle}
              >
                <Text variant="heading3">+</Text>
              </Flex>
            </Flex>
            {/* TODO(WEB-4920): search existing fee tiers for a match and optionally show this, with real TVL value */}
            {/* <Text variant="body2" color="$neutral2" textAlign="center">
              {t('fee.tier.alreadyExists', { formattedTVL: '$289.6K' })}
            </Text> */}
            {/* TODO(WEB-4920): search existing fee tiers for close matches and optionally similar list */}
            <Flex row>
              <Button
                variant="default"
                isDisabled={!createFeeValue || createFeeValue === ''}
                onPress={() => {
                  setPositionState((prevState) => ({
                    ...prevState,
                    fee: {
                      isDynamic: false,
                      feeAmount: feeHundredthsOfBips,
                      tickSpacing: calculateTickSpacingFromFeeAmount(feeHundredthsOfBips),
                    },
                  }))
                  sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
                    action: FeePoolSelectAction.Search,
                    fee_tier: feeHundredthsOfBips,
                    is_new_fee_tier: Boolean(feeTierData[feeHundredthsOfBips]),
                    ...trace,
                  })
                  onClose()
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                {feeTierData[feeHundredthsOfBips] ? t('fee.tier.select.existing.button') : t('fee.tier.create.button')}
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
              <Search size={20} color="$neutral2" />
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
                .map((pool) => (
                  <Flex
                    row
                    alignItems="center"
                    gap="$spacing24"
                    key={pool.id + pool.formattedFee}
                    py="$padding12"
                    justifyContent="space-between"
                    {...ClickableTamaguiStyle}
                    onPress={() => {
                      if (isDynamicFeeTier(pool.fee)) {
                        setDynamicFeeTierSpeedbumpData({
                          open: true,
                          wishFeeData: pool.fee,
                        })
                      } else {
                        setPositionState((prevState) => ({
                          ...prevState,
                          fee: {
                            isDynamic: pool.fee.isDynamic,
                            feeAmount: pool.fee.feeAmount,
                            tickSpacing: pool.fee.tickSpacing,
                          },
                        }))
                      }

                      onClose()
                    }}
                  >
                    <Flex>
                      <Flex row alignItems="center">
                        <Text variant="subheading2">{pool.formattedFee}</Text>
                        {isLpIncentivesEnabled && pool.boostedApr !== undefined && pool.boostedApr > 0 && (
                          <LpIncentivesAprDisplay lpIncentiveRewardApr={pool.boostedApr} isSmall ml="$spacing8" />
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
                    {getFeeTierKey(pool.fee.feeAmount, pool.fee.isDynamic) ===
                      getFeeTierKey(selectedFee.feeAmount, selectedFee.isDynamic) && (
                      <CheckCircleFilled size="$icon.24" color="$accent3" />
                    )}
                  </Flex>
                ))}
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
                onPress={() => setCreateModeEnabled(true)}
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
