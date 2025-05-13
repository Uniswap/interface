import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  LiquidityPositionRangeChartLoader,
  WrappedLiquidityPositionRangeChart,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { AdaptiveDropdown } from 'components/DropdownSelector/AdaptiveDropdown'
import {
  LiquidityPositionFeeStats,
  LiquidityPositionFeeStatsLoader,
  MinMaxRange,
} from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { useGetRangeDisplay, usePositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo, PriceOrdering } from 'components/Liquidity/types'
import { MouseoverTooltip } from 'components/Tooltip'
import useHoverProps from 'hooks/useHoverProps'
import { useLpIncentivesFormattedEarnings } from 'hooks/useLpIncentivesFormattedEarnings'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
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
import { zIndexes } from 'ui/src/theme/zIndexes'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { togglePositionVisibility } from 'uniswap/src/features/visibility/slice'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
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
    isOpenLiquidityPosition,
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
  const { value: isOpenContextMenu, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)

  const { formatCurrencyAmount } = useLocalizationContext()
  const isTouchDevice = useIsTouchDevice()
  const [pricesInverted, setPricesInverted] = useState(false)
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const [hover, hoverProps] = useHoverProps()
  const media = useMedia()
  const isSmallScreen = media.sm

  const { fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering, apr } =
    usePositionDerivedInfo(liquidityPosition)

  const [baseCurrency, quoteCurrency] = getInvertedTuple(
    [liquidityPosition.currency0Amount.currency, liquidityPosition.currency1Amount.currency],
    pricesInverted,
  )

  const formattedUsdValue =
    fiatValue0 && fiatValue1
      ? formatCurrencyAmount({
          value: fiatValue0.add(fiatValue1),
          type: NumberType.FiatStandard,
        })
      : undefined

  const { totalFormattedEarnings, hasRewards, formattedFeesValue } = useLpIncentivesFormattedEarnings({
    liquidityPosition,
    fiatFeeValue0,
    fiatFeeValue1,
  })

  const currency0Id =
    liquidityPosition?.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency0Amount.currency))
      : undefined
  const currency1Id =
    liquidityPosition?.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency1Amount.currency))
      : undefined

  const currency0Info = useCurrencyInfo(currency0Id)
  const currency1Info = useCurrencyInfo(currency1Id)

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
      base: baseCurrency,
      priceLower: pricesInverted
        ? liquidityPosition.position.token0PriceUpper.invert()
        : liquidityPosition.position.token0PriceLower,
      priceUpper: pricesInverted
        ? liquidityPosition.position.token0PriceLower.invert()
        : liquidityPosition.position.token0PriceUpper,
    }
  }, [liquidityPosition, baseCurrency, pricesInverted])

  return (
    <ContextMenu
      menuItems={dropdownOptions}
      isPlacementRight={!isMiniVersion}
      disabled={disabled}
      triggerMode={ContextMenuTriggerMode.Secondary}
      isOpen={isOpenContextMenu}
      openMenu={openContextMenu}
      closeMenu={closeContextMenu}
    >
      {isMiniVersion ? (
        <MiniPositionCard
          menuOptions={dropdownOptions}
          disabled={disabled}
          positionInfo={liquidityPosition}
          formattedUsdValue={formattedUsdValue}
          formattedUsdFees={formattedFeesValue}
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
            overflow="hidden"
            $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
          >
            <LiquidityPositionInfo
              positionInfo={liquidityPosition}
              isMiniVersion={isSmallScreen}
              showMigrateButton={showMigrateButton}
            />
            <WrappedLiquidityPositionRangeChart
              version={liquidityPosition.version}
              chainId={liquidityPosition.chainId}
              quoteCurrency={quoteCurrency}
              baseCurrency={baseCurrency}
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
            formattedUsdValue={formattedUsdValue}
            formattedUsdFees={formattedFeesValue}
            formattedLpIncentiveEarnings={totalFormattedEarnings}
            hasRewards={hasRewards}
            priceOrdering={priceOrdering}
            tickSpacing={liquidityPosition.tickSpacing}
            tickLower={liquidityPosition.tickLower}
            tickUpper={liquidityPosition.tickUpper}
            version={liquidityPosition.version}
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            apr={apr}
            cardHovered={hover && !disabled}
            pricesInverted={pricesInverted}
            setPricesInverted={setPricesInverted}
            lpIncentiveRewardApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.boostedApr
                : undefined
            }
            totalApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.totalApr
                : undefined
            }
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
        <MoreHorizontal size="$icon.16" color="white" />
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
        <MenuContent items={menuOptions} handleCloseMenu={() => setIsOpen(false)} />
      </AdaptiveDropdown>
    </Flex>
  )
}
