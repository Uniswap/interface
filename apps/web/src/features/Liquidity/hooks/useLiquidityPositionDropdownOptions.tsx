import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { Flag } from 'ui/src/components/icons/Flag'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { usePoolPositionCacheUpdater } from 'uniswap/src/features/dataApi/balances/poolPositionCacheUpdater'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { logCollectFeesClick } from '~/features/Liquidity/analytics'
import { useReportPositionHandler } from '~/features/Liquidity/hooks/useReportPositionHandler'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'

export function useLiquidityPositionDropdownOptions({
  liquidityPosition,
  showVisibilityOption,
  isVisible,
  readOnly = false,
}: {
  liquidityPosition: PositionInfo
  showVisibilityOption?: boolean
  isVisible: boolean
  readOnly?: boolean
}): MenuOptionItem[] {
  const { t } = useTranslation()
  const trace = useTrace()
  const isOpenLiquidityPosition = liquidityPosition.status !== PositionStatus.CLOSED

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const selectChain = useSelectChain()
  const activeAddresses = useActiveAddresses()
  const updatePoolBalancesCache = usePoolPositionCacheUpdater(activeAddresses.evmAddress, activeAddresses.svmAddress)
  const reportPositionHandler = useReportPositionHandler({ position: liquidityPosition, isVisible })

  return useMemo(() => {
    const chainInfo = getChainInfo(liquidityPosition.chainId)
    const isV2Position = liquidityPosition.version === ProtocolVersion.V2
    const isV3Position = liquidityPosition.version === ProtocolVersion.V3
    const showMigrateV3Option =
      isV3Position && isOpenLiquidityPosition && !isV4UnsupportedChain(liquidityPosition.chainId)
    const hasFees = liquidityPosition.fee0Amount?.greaterThan(0) || liquidityPosition.fee1Amount?.greaterThan(0)

    const viewPoolInfoOption: MenuOptionItem = {
      onPress: () => {
        if (!liquidityPosition.poolId) {
          return
        }
        navigate(getPoolDetailsURL(liquidityPosition.poolId, liquidityPosition.chainId))
      },
      label: t('pool.info'),
      Icon: InfoCircleFilled,
    }

    // Read-only callers (e.g. watched wallets) can only view the pool — every other action would mutate the owner's positions.
    if (readOnly) {
      return [viewPoolInfoOption]
    }

    const options: MenuOptionItem[] = []

    if (!isV2Position && isOpenLiquidityPosition && hasFees) {
      options.push({
        onPress: () => {
          logCollectFeesClick(liquidityPosition, trace)
          dispatch(
            setOpenModal({
              name: ModalName.ClaimFee,
              initialState: liquidityPosition,
            }),
          )
        },
        label: t('pool.collectFees'),
        Icon: Dollar,
      })
    }

    // closed v2 positions cannot re-add liquidity since the erc20 liquidity token is permanently burned when closed,
    // whereas v3 positions can be re-opened
    if (!isV2Position || isOpenLiquidityPosition) {
      options.push({
        onPress: () => {
          dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: liquidityPosition }))
        },
        label: t('common.addLiquidity'),
        Icon: Plus,
      })
    }

    if (isOpenLiquidityPosition) {
      options.push({
        onPress: () => {
          dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: liquidityPosition }))
        },
        label: t('pool.removeLiquidity'),
        Icon: Minus,
      })
    }

    // Add migration options if relevant

    if (isV2Position && isOpenLiquidityPosition) {
      options.push({
        onPress: async () => {
          if (liquidityPosition.chainId !== account.chainId) {
            await selectChain(liquidityPosition.chainId)
          }
          navigate(`/migrate/v2/${chainInfo.urlParam}/${liquidityPosition.liquidityToken.address}`)
        },
        label: t('pool.migrateLiquidity'),
        Icon: ArrowRight,
      })
    }

    if (showMigrateV3Option) {
      options.push({
        onPress: () => {
          navigate(`/migrate/v3/${chainInfo.urlParam}/${liquidityPosition.tokenId}`)
        },
        label: t('pool.migrateLiquidity'),
        Icon: ArrowRight,
      })
    }

    options.push(viewPoolInfoOption)

    if (showVisibilityOption) {
      options.push({
        onPress: () => {
          // Optimistic header update: modifier is excluded from the GetWalletBalances cache key,
          // so the state change below would not naturally refetch — the cache writer bridges
          // the visual gap until the next poll reconciles with the new modifier.
          // Note: current `isVisible` becomes the post-toggle `hidden` value (the user is
          // transitioning from "visible=true" to "hidden=true", so they match).
          updatePoolBalancesCache(isVisible, liquidityPosition)
          dispatch(
            setPositionVisibility({
              poolId: liquidityPosition.poolId,
              tokenId: liquidityPosition.tokenId,
              chainId: liquidityPosition.chainId,
              isVisible: !isVisible,
            }),
          )
        },
        label: isVisible ? t('position.hide') : t('position.unhide'),
        Icon: isVisible ? EyeOff : Eye,
        showDivider: true,
      })

      if (!liquidityPosition.isHidden) {
        options.push({
          onPress: reportPositionHandler,
          label: t('nft.reportSpam'),
          Icon: Flag,
          destructive: true,
        })
      }
    }

    return options
  }, [
    account.chainId,
    dispatch,
    readOnly,
    isOpenLiquidityPosition,
    reportPositionHandler,
    isVisible,
    liquidityPosition,
    navigate,
    showVisibilityOption,
    selectChain,
    updatePoolBalancesCache,
    t,
    trace,
  ])
}
