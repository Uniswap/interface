// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  LiquidityPositionRangeChart,
  LiquidityPositionRangeChartLoader,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import {
  LiquidityPositionFeeStats,
  LiquidityPositionFeeStatsLoader,
} from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { useGetRangeDisplay, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { PriceOrdering } from 'components/PositionListItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { getPoolDetailsURL } from 'graphql/data/util'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useMemo, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import {
  Button,
  Flex,
  GeneratedIcon,
  Separator,
  Shine,
  Text,
  TouchableArea,
  useIsTouchDevice,
  useSporeColors,
} from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { iconSizes } from 'ui/src/theme'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { useTranslation } from 'uniswap/src/i18n/useTranslation'
import { NumberType } from 'utilities/src/format/types'
import { useAccount } from 'wagmi'

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

export function LiquidityPositionCardLoader() {
  return (
    <Shine>
      <Flex
        p="$spacing24"
        gap="$spacing24"
        borderWidth={1}
        borderRadius="$rounded20"
        borderColor="$surface3"
        width="100%"
        overflow="hidden"
        $md={{ gap: '$gap20' }}
      >
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
        >
          <LiquidityPositionInfoLoader />
          <LiquidityPositionRangeChartLoader />
        </Flex>
        <LiquidityPositionFeeStatsLoader />
      </Flex>
    </Shine>
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
  const isTouchDevice = useIsTouchDevice()
  const [pricesInverted, setPricesInverted] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const switchChain = useSwitchChain()
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
          type: NumberType.FiatStandard,
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

    const chainInfo = getChainInfo(liquidityPosition.chainId)

    const migrateV2Option = {
      key: 'position-card-migrate',
      onPress: async () => {
        if (chainInfo.id !== account.chainId) {
          await switchChain(chainInfo.id)
        }
        navigate(`/migrate/v2/${liquidityPosition.liquidityToken?.address ?? ''}`)
      },
      render: () => <DropdownOptionRender Icon={RightArrow}>{t('pool.migrateLiquidity')}</DropdownOptionRender>,
    }

    if (liquidityPosition.version === ProtocolVersion.V2) {
      return [...v2Options, migrateV2Option]
    }

    const migrateV3Option = {
      key: 'position-card-migrate',
      onPress: () => {
        navigate(`/migrate/v3/${chainInfo.urlParam}/${liquidityPosition.tokenId}`)
      },
      render: () => <DropdownOptionRender Icon={RightArrow}>{t('pool.migrateLiquidity')}</DropdownOptionRender>,
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
      migrateV3Option,
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
  }, [liquidityPosition, dispatch, t, account.chainId, navigate, switchChain])

  const priceOrderingForChart = useMemo(() => {
    if (
      (liquidityPosition?.version !== ProtocolVersion.V3 && liquidityPosition?.version !== ProtocolVersion.V4) ||
      !liquidityPosition.position ||
      !liquidityPosition.liquidity ||
      !liquidityPosition.tickLower ||
      !liquidityPosition.tickUpper
    ) {
      return {}
    }
    return {
      base: pricesInverted ? liquidityPosition.position.amount1.currency : liquidityPosition.position.amount0.currency,
      priceLower: liquidityPosition.position.token0PriceLower,
      priceUpper: liquidityPosition.position.token0PriceUpper,
    }
  }, [liquidityPosition, pricesInverted])

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
      $md={{ gap: '$gap20' }}
      hoverStyle={isClickableStyle ? { backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' } : {}}
      pressStyle={isClickableStyle ? { backgroundColor: '$surface1Pressed', borderColor: '$surface3Pressed' } : {}}
    >
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
      >
        <LiquidityPositionInfo positionInfo={liquidityPosition} />
        <LiquidityPositionRangeChart
          version={liquidityPosition.version}
          chainId={liquidityPosition.chainId}
          currency0={
            pricesInverted ? liquidityPosition.currency1Amount.currency : liquidityPosition.currency0Amount.currency
          }
          currency1={
            pricesInverted ? liquidityPosition.currency0Amount.currency : liquidityPosition.currency1Amount.currency
          }
          positionStatus={liquidityPosition.status}
          poolAddressOrId={liquidityPosition.poolId}
          priceOrdering={priceOrderingForChart}
        />
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
        pricesInverted={pricesInverted}
        setPricesInverted={setPricesInverted}
      />
      {!isTouchDevice && (
        <Flex
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          animation="fast"
          opacity={0}
          pointerEvents="none"
          $group-hover={{ opacity: 1, pointerEvents: 'auto' }}
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
      )}
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
      hoverStyle={isClickableStyle ? { backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' } : {}}
      pressStyle={isClickableStyle ? { backgroundColor: '$surface1Pressed', borderColor: '$surface3Pressed' } : {}}
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
