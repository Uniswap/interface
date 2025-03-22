import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { TokenItemWrapperProps } from 'uniswap/src/components/TokenSelector/types'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openURL } from 'uniswap/src/utils/link'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { isExtension } from 'utilities/src/platform'

function _TokenOptionItemWrapper({ children, tokenInfo }: TokenItemWrapperProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [copied, setCopied] = useState(false)

  const onNavigateToTokenDetails = useCallback(async () => {
    if (isTestnetModeEnabled) {
      return
    }

    const url = getTokenDetailsURL(tokenInfo)

    if (isExtension) {
      await openURL(`${UNISWAP_WEB_URL}${url}`)
    } else {
      navigate(url)
    }
  }, [navigate, tokenInfo, isTestnetModeEnabled])

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

export const TokenOptionItemWrapper = React.memo(_TokenOptionItemWrapper)
