// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionFeeStats } from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { LiquidityPositionRangeChart } from 'components/Liquidity/LiquidityPositionRangeChart'
import { useGetRangeDisplay, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { PriceOrdering } from 'components/PositionListItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { getPoolDetailsURL } from 'graphql/data/util'
import { useMemo, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Button, Flex, GeneratedIcon, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { iconSizes } from 'ui/src/theme'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { useTranslation } from 'uniswap/src/i18n/useTranslation'
import { NumberType } from 'utilities/src/format/types'

function DropdownOptionRender({ children, Icon }: { children: React.ReactNode; Icon: GeneratedIcon }) {
  return (
    <Flex row alignItems="center" p="$padding8" gap="$gap8" alignContent="center" borderRadius="$rounded12">
      <Icon size="$icon.20" color="$neutral2" />
      <Text variant="subheading2" color="$neutral1">
        {children}
      </Text>
    </Flex>
  )
}

export function LiquidityPositionCard({
  liquidityPosition,
  isMiniVersion,
  isClickableStyle,
}: {
  liquidityPosition: PositionInfo
  isMiniVersion?: boolean
  isClickableStyle?: boolean
}) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering, apr } =
    useV3OrV4PositionDerivedInfo(liquidityPosition)

  const token0USDValue = useUSDCValue(liquidityPosition.currency0Amount)
  const token1USDValue = useUSDCValue(liquidityPosition.currency1Amount)

  const v3OrV4FormattedUsdValue =
    fiatValue0 && fiatValue1
      ? formatCurrencyAmount({
          value: fiatValue0.add(fiatValue1),
          type: NumberType.FiatStandard,
        })
      : undefined
  const v2FormattedUsdValue =
    token0USDValue && token1USDValue
      ? formatCurrencyAmount({ value: token0USDValue.add(token1USDValue), type: NumberType.FiatStandard })
      : undefined

  const v3OrV4FormattedFeesValue =
    fiatFeeValue0 && fiatFeeValue1
      ? formatCurrencyAmount({
          value: fiatFeeValue0.add(fiatFeeValue1),
          type:
            liquidityPosition.status === PositionStatus.CLOSED ? NumberType.FiatStandard : NumberType.FiatTokenPrice,
        })
      : undefined

  const dropdownOptions = useMemo(() => {
    const v2Options = [
      {
        key: 'position-card-add-liquidity',
        onPress: () => {
          dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: liquidityPosition }))
        },
        render: () => <DropdownOptionRender Icon={Plus}>{t('common.addLiquidity')}</DropdownOptionRender>,
      },
      {
        key: 'position-card-remove-liquidity',
        onPress: () => {
          dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: liquidityPosition }))
        },
        render: () => <DropdownOptionRender Icon={Minus}>{t('pool.removeLiquidity')}</DropdownOptionRender>,
      },
    ]

    if (liquidityPosition.version === ProtocolVersion.V2) {
      return v2Options
    }

    return [
      {
        key: 'position-card-collect-fees',
        onPress: () => {
          dispatch(
            setOpenModal({ name: ModalName.ClaimFee, initialState: { ...liquidityPosition, collectAsWeth: false } }),
          )
        },
        render: () => <DropdownOptionRender Icon={Dollar}>{t('pool.collectFees')}</DropdownOptionRender>,
      },
      ...v2Options,
      {
        key: 'position-card-separator',
        onPress: () => null,
        render: () => <Separator />,
      },
      {
        key: 'position-card-pool-info',
        onPress: () => {
          if (!liquidityPosition.poolId) {
            return
          }

          navigate(getPoolDetailsURL(liquidityPosition.poolId, toGraphQLChain(liquidityPosition.chainId)))
        },
        render: () => <DropdownOptionRender Icon={InfoCircleFilled}>{t('pool.info')}</DropdownOptionRender>,
      },
    ]
  }, [liquidityPosition, dispatch, t, navigate])

  if (isMiniVersion) {
    return (
      <MiniPositionCard
        isClickableStyle={isClickableStyle}
        positionInfo={liquidityPosition}
        formattedUsdValue={v3OrV4FormattedUsdValue ?? v2FormattedUsdValue}
        formattedUsdFees={v3OrV4FormattedFeesValue}
        priceOrdering={priceOrdering}
        feeTier={liquidityPosition.feeTier?.toString()}
        tickLower={liquidityPosition.tickLower}
        tickUpper={liquidityPosition.tickUpper}
      />
    )
  }

  return (
    <Flex
      group
      position="relative"
      p="$spacing24"
      gap="$spacing24"
      borderWidth={1}
      borderRadius="$rounded20"
      borderColor="$surface3"
      width="100%"
      overflow="hidden"
      hoverStyle={
        isClickableStyle
          ? {
              backgroundColor: '$surface1Hovered',
              borderColor: '$surface3Hovered',
            }
          : {}
      }
    >
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
      >
        <LiquidityPositionInfo positionInfo={liquidityPosition} />
        <LiquidityPositionRangeChart positionInfo={liquidityPosition} />
      </Flex>
      <LiquidityPositionFeeStats
        formattedUsdValue={v3OrV4FormattedUsdValue ?? v2FormattedUsdValue}
        formattedUsdFees={v3OrV4FormattedFeesValue}
        priceOrdering={priceOrdering}
        feeTier={liquidityPosition.feeTier?.toString()}
        tickLower={liquidityPosition.tickLower}
        tickUpper={liquidityPosition.tickUpper}
        version={liquidityPosition.version}
        apr={apr}
      />
      <Flex
        position="absolute"
        top="$spacing16"
        right="$spacing16"
        animation="fast"
        opacity={0}
        $group-hover={{ opacity: 1 }}
      >
        <ActionSheetDropdown
          showArrow={false}
          closeOnSelect={true}
          onPress={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          styles={{
            dropdownMinWidth: 200,
            buttonPaddingX: '$spacing8',
            buttonPaddingY: '$spacing8',
            dropdownGap: 2,
            alignment: 'right',
          }}
          options={dropdownOptions}
        >
          <Button size="small" theme="secondary" backgroundColor="$surface3">
            <MoreHorizontal size={iconSizes.icon16} color={colors.neutral1.val} />
          </Button>
        </ActionSheetDropdown>
      </Flex>
    </Flex>
  )
}

function MiniPositionCard({
  positionInfo,
  formattedUsdFees,
  formattedUsdValue,
  priceOrdering,
  feeTier,
  tickLower,
  tickUpper,
  isClickableStyle,
}: {
  positionInfo: PositionInfo
  formattedUsdFees?: string
  formattedUsdValue?: string
  priceOrdering: PriceOrdering
  feeTier?: string
  tickLower?: string
  tickUpper?: string
  isClickableStyle?: boolean
}) {
  const { t } = useTranslation()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex
      gap="$gap20"
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth={1}
      m="$spacing16"
      hoverStyle={
        isClickableStyle
          ? {
              backgroundColor: '$surface1Hovered',
              borderColor: '$surface3Hovered',
            }
          : {}
      }
    >
      <LiquidityPositionInfo hideStatusIndicator positionInfo={positionInfo} currencyLogoSize={32} />
      <Flex row gap="$gap12">
        <Flex>
          {formattedUsdValue ? (
            <Text variant="body2">{formattedUsdValue}</Text>
          ) : (
            <MouseoverTooltip text={t('position.valueUnavailable')} placement="top">
              <Text variant="body2">-</Text>
            </MouseoverTooltip>
          )}
          <Text variant="body4" color="$neutral2">
            {t('pool.position')}
          </Text>
        </Flex>
        <Flex>
          <Text variant="body2">{formattedUsdFees || t('common.unavailable')}</Text>
          <Text variant="body4" color="$neutral2">
            {t('common.fees')}
          </Text>
        </Flex>
      </Flex>
      {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
        <TouchableArea
          {...ClickableTamaguiStyle}
          onPress={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setPricesInverted((prevInverted) => !prevInverted)
          }}
        >
          <Flex row gap={10}>
            <Text variant="body4">
              {minPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
            <ArrowsLeftRight color="$neutral2" size="$icon.16" />
            <Text variant="body4">
              {maxPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
          </Flex>
        </TouchableArea>
      ) : (
        <Text variant="body4">{t('common.fullRange')}</Text>
      )}
    </Flex>
  )
}
