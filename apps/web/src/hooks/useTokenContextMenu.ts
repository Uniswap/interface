import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioCacheUpdater } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { setTokenVisibility } from 'uniswap/src/features/visibility/slice'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { getChainUrlParam } from 'utils/chainParams'

interface TokenMenuParams {
  tokenBalance: PortfolioBalance
}

export function useTokenContextMenu({ tokenBalance }: TokenMenuParams): MenuOptionItem[] {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [copied, setCopied] = useState(false)

  // Updating token visibility triggers a portfolio reload
  // To prevent an empty state during the fetch, we update the cache proactively
  const updateCache = usePortfolioCacheUpdater(account.address!)
  const onUpdateCache = useCallback(
    (isVisible: boolean, tokenBalance: PortfolioBalance) => {
      if (account.address) {
        updateCache(isVisible, tokenBalance)
      }
    },
    [account.address, updateCache],
  )

  const { balanceUSD, quantity, isHidden, currencyInfo } = tokenBalance
  const { chainId, isNative } = currencyInfo.currency
  const tokenAddress = isNative ? NATIVE_TOKEN_PLACEHOLDER : currencyInfo.currency.address

  const chainUrlParam = getChainUrlParam(chainId)
  const isVisible = !isHidden

  const hasTokenBalance = quantity > 0 && !!balanceUSD && balanceUSD > 0

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(tokenAddress)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 400)
  }, [tokenAddress])

  const onNavigateToSend = useCallback(() => {
    navigate(`/send?chain=${chainUrlParam}&inputCurrency=${tokenAddress}`)
  }, [navigate, tokenAddress, chainUrlParam])

  const onNavigateToSwap = useCallback(() => {
    navigate(`/swap?chain=${chainUrlParam}&inputCurrency=${tokenAddress}`)
  }, [navigate, tokenAddress, chainUrlParam])

  const onNavigateToTokenDetails = useCallback(() => {
    if (isTestnetModeEnabled) {
      return
    }

    const url = getTokenDetailsURL({
      chainUrlParam,
      chain: chainId,
      address: tokenAddress,
    })
    navigate(url)
  }, [isTestnetModeEnabled, navigate, tokenAddress, chainId, chainUrlParam])

  const onToggleTokenVisibility = useCallback(() => {
    onUpdateCache(isVisible, tokenBalance)
    dispatch(setTokenVisibility({ currencyId: currencyInfo.currencyId.toLowerCase(), isVisible: !isVisible }))
  }, [onUpdateCache, isVisible, tokenBalance, dispatch, currencyInfo.currencyId])

  return useMemo(() => {
    const actions: MenuOptionItem[] = [
      {
        onPress: onCopyAddress,
        label: copied ? t('notification.copied.address') : t('common.copy.address'),
        Icon: copied ? CheckCircleFilled : CopyAlt,
        disabled: isNative,
        closeDelay: 400,
        iconColor: copied ? '$statusSuccess' : '$neutral2',
      },
      {
        label: t('common.button.swap'),
        onPress: onNavigateToSwap,
        Icon: CoinConvert,
      },
      {
        label: t('common.button.send'),
        onPress: onNavigateToSend,
        Icon: SendAction,
      },
      {
        label: t('token.details'),
        onPress: onNavigateToTokenDetails,
        Icon: InfoCircleFilled,
      },
    ]

    if (hasTokenBalance) {
      actions.push({
        label: isVisible ? t('tokens.action.hide') : t('tokens.action.unhide'),
        onPress: onToggleTokenVisibility,
        Icon: isVisible ? EyeOff : Eye,
        showDivider: true,
      })
    }

    return actions
  }, [
    onCopyAddress,
    copied,
    t,
    isNative,
    onNavigateToSwap,
    onNavigateToSend,
    onNavigateToTokenDetails,
    hasTokenBalance,
    isVisible,
    onToggleTokenVisibility,
  ])
}
