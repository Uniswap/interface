import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  LiquidityPositionRangeChart,
  LiquidityPositionRangeChartLoader,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { AdaptiveDropdown } from 'components/DropdownSelector/AdaptiveDropdown'
import {
  LiquidityPositionFeeStats,
  LiquidityPositionFeeStatsLoader,
  MinMaxRange,
} from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { useGetRangeDisplay, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo, PriceOrdering } from 'components/Liquidity/types'
import { MouseoverTooltip } from 'components/Tooltip'
import useHoverProps from 'hooks/useHoverProps'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, FlexProps, Shine, Text, TouchableArea, styled, useIsTouchDevice, useMedia } from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Minus } from 'ui/src/components/icons/Minus'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Plus } from 'ui/src/components/icons/Plus'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { iconSizes } from 'ui/src/theme'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { togglePositionVisibility } from 'uniswap/src/features/visibility/slice'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'
import { useAccount } from 'wagmi'

export function LiquidityPositionCardLoader() {
  return (
    <Shine>
      <Flex
        p="$spacing24"
        gap="$spacing24"
        borderWidth="$spacing1"
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
          <LiquidityPositionRangeChartLoader height={CHART_HEIGHT} width={CHART_WIDTH} position="relative" />
        </Flex>
        <LiquidityPositionFeeStatsLoader />
      </Flex>
    </Shine>
  )
}

function useDropdownOptions(
  liquidityPosition: PositionInfo,
  showVisibilityOption?: boolean,
  isVisible?: boolean,
): MenuOptionItem[] {
  const { t } = useTranslation()
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const isMigrateToV4Enabled = useFeatureFlag(FeatureFlags.MigrateV3ToV4)
  const isOpenLiquidityPosition = liquidityPosition.status !== PositionStatus.CLOSED

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const switchChain = useSwitchChain()

  return useMemo(() => {
    const chainInfo = getChainInfo(liquidityPosition.chainId)

    const addLiquidityOption = {
      onPress: () => {
        dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: liquidityPosition }))
      },
      label: t('common.addLiquidity'),
      Icon: Plus,
    }

    const removeLiquidityOption: MenuOptionItem | undefined = isOpenLiquidityPosition
      ? {
          onPress: () => {
            dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: liquidityPosition }))
          },
          label: t('pool.removeLiquidity'),
          Icon: Minus,
        }
      : undefined

    const poolInfoOption = {
      onPress: () => {
        if (!liquidityPosition.poolId) {
          return
        }

        navigate(getPoolDetailsURL(liquidityPosition.poolId, liquidityPosition.chainId))
      },
      label: t('pool.info'),
      Icon: InfoCircleFilled,
    }

    const hideOption: MenuOptionItem | undefined = showVisibilityOption
      ? {
          onPress: () => {
            dispatch(
              togglePositionVisibility({
                poolId: liquidityPosition.poolId,
                tokenId: liquidityPosition.tokenId,
                chainId: liquidityPosition.chainId,
              }),
            )
          },
          label: isVisible ? t('common.hide.button') : t('common.unhide'),
          Icon: isVisible ? EyeOff : Eye,
          showDivider: true,
        }
      : undefined

    if (liquidityPosition.version === ProtocolVersion.V2) {
      const migrateV2Option = isOpenLiquidityPosition
        ? {
            onPress: async () => {
              if (chainInfo.id !== account.chainId) {
                await switchChain(chainInfo.id)
              }
              navigate(`/migrate/v2/${liquidityPosition.liquidityToken?.address ?? ''}`)
            },
            label: t('pool.migrateLiquidity'),
            Icon: RightArrow,
          }
        : undefined

      return [
        isOpenLiquidityPosition ? addLiquidityOption : undefined, // closed v2 positions cannot re-add liquidity since the erc20 liquidity token is permanently burned when closed. whereas v3 positions can be re-opened
        removeLiquidityOption,
        migrateV2Option,
        poolInfoOption,
        hideOption,
      ].filter((o): o is MenuOptionItem => o !== undefined)
    }

    const collectFeesOption: MenuOptionItem | undefined = isOpenLiquidityPosition
      ? {
          onPress: () => {
            dispatch(
              setOpenModal({
                name: ModalName.ClaimFee,
                initialState: liquidityPosition,
              }),
            )
          },
          label: t('pool.collectFees'),
          Icon: Dollar,
        }
      : undefined

    const showMigrateV3Option =
      isOpenLiquidityPosition &&
      isV4DataEnabled &&
      isMigrateToV4Enabled &&
      !isV4UnsupportedChain(liquidityPosition.chainId) &&
      liquidityPosition.version !== ProtocolVersion.V4

    const migrateV3Option: MenuOptionItem | undefined = showMigrateV3Option
      ? {
          onPress: () => {
            navigate(`/migrate/v3/${chainInfo.urlParam}/${liquidityPosition.tokenId}`)
          },
          label: t('pool.migrateLiquidity'),
          Icon: RightArrow,
        }
      : undefined

    return [
      collectFeesOption,
      addLiquidityOption,
      removeLiquidityOption,
      migrateV3Option,
      poolInfoOption,
      hideOption,
    ].filter((o): o is MenuOptionItem => o !== undefined)
  }, [
    account.chainId,
    dispatch,
    isMigrateToV4Enabled,
    isOpenLiquidityPosition,
    isV4DataEnabled,
    isVisible,
    liquidityPosition,
    navigate,
    showVisibilityOption,
    switchChain,
    t,
  ])
}

export function LiquidityPositionCard({
  liquidityPosition,
  isMiniVersion,
  showVisibilityOption,
  showMigrateButton = false,
  isVisible = true,
  disabled = false,
}: {
  liquidityPosition: PositionInfo
  isMiniVersion?: boolean
  showVisibilityOption?: boolean
  showMigrateButton?: boolean
  isVisible?: boolean
  disabled?: boolean
}) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const isTouchDevice = useIsTouchDevice()
  const [pricesInverted, setPricesInverted] = useState(false)

  const [hover, hoverProps] = useHoverProps()
  const media = useMedia()
  const isSmallScreen = media.sm

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

  const dropdownOptions = useDropdownOptions(liquidityPosition, showVisibilityOption, isVisible)

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
      priceLower: pricesInverted
        ? liquidityPosition.position.token0PriceUpper
        : liquidityPosition.position.token0PriceLower.invert(),
      priceUpper: pricesInverted
        ? liquidityPosition.position.token0PriceLower
        : liquidityPosition.position.token0PriceUpper.invert(),
    }
  }, [liquidityPosition, pricesInverted])

  return (
    <ContextMenu menuItems={dropdownOptions} alignContentLeft={isMiniVersion} disabled={disabled}>
      {isMiniVersion ? (
        <MiniPositionCard
          menuOptions={dropdownOptions}
          disabled={disabled}
          positionInfo={liquidityPosition}
          formattedUsdValue={v3OrV4FormattedUsdValue ?? v2FormattedUsdValue}
          formattedUsdFees={v3OrV4FormattedFeesValue}
          priceOrdering={priceOrdering}
          tickSpacing={liquidityPosition.tickSpacing}
          tickLower={liquidityPosition.tickLower}
          tickUpper={liquidityPosition.tickUpper}
        />
      ) : (
        <Flex
          {...hoverProps}
          group
          position="relative"
          gap="$spacing16"
          borderWidth="$spacing1"
          borderRadius="$rounded20"
          borderColor="$surface3"
          width="100%"
          hoverStyle={!disabled ? { borderColor: '$surface3Hovered', backgroundColor: '$surface1Hovered' } : {}}
        >
          <Flex
            row
            pt="$spacing24"
            px="$spacing24"
            alignItems="center"
            justifyContent="space-between"
            $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
          >
            <LiquidityPositionInfo
              positionInfo={liquidityPosition}
              isMiniVersion={isSmallScreen}
              showMigrateButton={showMigrateButton}
            />
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
            <Flex $md={{ display: 'block' }} display="none" width="100%">
              <MinMaxRange
                priceOrdering={priceOrdering}
                tickLower={liquidityPosition.tickLower}
                tickUpper={liquidityPosition.tickUpper}
                tickSpacing={liquidityPosition.tickSpacing}
                pricesInverted={pricesInverted}
                setPricesInverted={setPricesInverted}
              />
            </Flex>
          </Flex>
          <LiquidityPositionFeeStats
            formattedUsdValue={v3OrV4FormattedUsdValue ?? v2FormattedUsdValue}
            formattedUsdFees={v3OrV4FormattedFeesValue}
            priceOrdering={priceOrdering}
            tickSpacing={liquidityPosition.tickSpacing}
            tickLower={liquidityPosition.tickLower}
            tickUpper={liquidityPosition.tickUpper}
            version={liquidityPosition.version}
            apr={apr}
            cardHovered={hover && !disabled}
            pricesInverted={pricesInverted}
            setPricesInverted={setPricesInverted}
          />
          {!isTouchDevice && !disabled && <PositionDropdownMoreMenu menuOptions={dropdownOptions} />}
        </Flex>
      )}
    </ContextMenu>
  )
}

function MiniPositionCard({
  positionInfo,
  menuOptions,
  formattedUsdFees,
  formattedUsdValue,
  priceOrdering,
  tickSpacing,
  tickLower,
  tickUpper,
  disabled,
}: {
  positionInfo: PositionInfo
  menuOptions: MenuOptionItem[]
  formattedUsdFees?: string
  formattedUsdValue?: string
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: string
  tickUpper?: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing,
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
      borderWidth="$spacing1"
      position="relative"
      group
      hoverStyle={!disabled ? { backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' } : {}}
      pressStyle={!disabled ? { backgroundColor: '$surface1Pressed', borderColor: '$surface3Pressed' } : {}}
    >
      <LiquidityPositionInfo hideStatusIndicator positionInfo={positionInfo} currencyLogoSize={32} isMiniVersion />
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
      <PositionDropdownMoreMenu menuOptions={menuOptions} />
    </Flex>
  )
}

const activeStyle: FlexProps = { opacity: 1, pointerEvents: 'auto', backgroundColor: '$scrim' }
const PositionDetailsMenuButton = styled(Flex, {
  animation: 'fast',
  opacity: 0,
  borderRadius: '$rounded12',
  p: '$spacing8',
  variants: {
    open: {
      true: activeStyle,
    },
  },
})

function PositionDropdownMoreMenu({ menuOptions }: { menuOptions: MenuOptionItem[] }) {
  const [isOpen, setIsOpen] = useState(false)

  const dropdownTrigger = (
    <TouchableArea
      zIndex={zIndexes.mask}
      onPress={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(!isOpen)
      }}
    >
      <PositionDetailsMenuButton $group-hover={activeStyle} open={isOpen} onPress={() => {}}>
        <MoreHorizontal size={iconSizes.icon16} color="white" />
      </PositionDetailsMenuButton>
    </TouchableArea>
  )

  return (
    <Flex position="absolute" top="$spacing16" right="$spacing16">
      <AdaptiveDropdown
        alignRight
        allowFlip
        positionFixed
        isOpen={isOpen}
        toggleOpen={setIsOpen}
        trigger={dropdownTrigger}
        dropdownStyle={{
          p: 0,
          backgroundColor: 'transparent',
          borderRadius: '$rounded20',
          minWidth: 'max-content',
          borderWidth: 0,
        }}
      >
        <MenuContent items={menuOptions} onItemClick={() => setIsOpen(false)} />
      </AdaptiveDropdown>
    </Flex>
  )
}
