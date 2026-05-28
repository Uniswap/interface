import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { PoolOptionItemContextMenuProps } from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openURL } from 'uniswap/src/utils/link'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { isExtension } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const PoolOptionItemContextMenu = memo(function _PoolOptionItemContextMenu({
  children,
  poolInfo,
}: PoolOptionItemContextMenuProps): JSX.Element {
  const { poolId, chain } = poolInfo
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [copied, setCopied] = useState(false)

  const onNavigateToPoolDetails = useCallback(async () => {
    if (isTestnetModeEnabled) {
      return
    }

    const url = getPoolDetailsURL(poolId, chain)

    if (isExtension) {
      await openURL(`${UNISWAP_WEB_URL}${url}`)
    } else {
      navigate(url)
    }
  }, [navigate, poolId, chain, isTestnetModeEnabled])

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(poolId)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 400)
  }, [poolId])

  const dropdownOptions = useMemo(
    () => [
      {
        key: 'token-selector-copy-address',
        onPress: onCopyAddress,
        label: copied ? t('notification.copied.address') : t('common.copy.address'),
        Icon: copied ? CheckCircleFilled : CopyAlt,
        closeDelay: 400,
        iconColor: copied ? '$statusSuccess' : '$neutral2',
      },
      {
        key: 'token-selector-token-info',
        onPress: onNavigateToPoolDetails,
        label: t('pool.details'),
        Icon: InfoCircleFilled,
      },
    ],
    [onNavigateToPoolDetails, t, onCopyAddress, copied],
  )

  const { value: isOpen, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)

  return (
    <ContextMenu
      menuItems={dropdownOptions}
      triggerMode={ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      closeMenu={closeContextMenu}
      openMenu={openContextMenu}
    >
      {children}
    </ContextMenu>
  )
})
