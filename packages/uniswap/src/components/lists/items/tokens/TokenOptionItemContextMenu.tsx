import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

interface TokenOptionItemContextMenuProps {
  children: ReactNode
  tokenInfo: {
    address: string
    chain: number
    isNative: boolean
  }
}

function _TokenOptionItemContextMenu({ children, tokenInfo }: TokenOptionItemContextMenuProps): JSX.Element {
  const { t } = useTranslation()
  const { navigateToTokenDetails } = useUniswapContext()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [copied, setCopied] = useState(false)

  const onNavigateToTokenDetails = useCallback(() => {
    if (isTestnetModeEnabled) {
      return
    }

    navigateToTokenDetails(buildCurrencyId(tokenInfo.chain, tokenInfo.address))
  }, [isTestnetModeEnabled, navigateToTokenDetails, tokenInfo.chain, tokenInfo.address])

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(tokenInfo.address)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 400)
  }, [tokenInfo.address])

  const dropdownOptions = useMemo(
    () => [
      {
        key: 'token-selector-copy-address',
        onPress: onCopyAddress,
        disabled: tokenInfo.isNative,
        label: copied ? t('notification.copied.address') : t('common.copy.address'),
        Icon: copied ? CheckCircleFilled : CopyAlt,
        closeDelay: 400,
        iconProps: {
          color: copied ? '$statusSuccess' : '$neutral2',
        },
      },
      {
        key: 'token-selector-token-info',
        onPress: onNavigateToTokenDetails,
        label: t('token.details'),
        Icon: InfoCircleFilled,
      },
    ],
    [onNavigateToTokenDetails, t, onCopyAddress, copied, tokenInfo.isNative],
  )

  return (
    <ContextMenu menuStyleProps={{ minWidth: 200 }} menuItems={dropdownOptions}>
      {children}
    </ContextMenu>
  )
}

export const TokenOptionItemContextMenu = React.memo(_TokenOptionItemContextMenu)
