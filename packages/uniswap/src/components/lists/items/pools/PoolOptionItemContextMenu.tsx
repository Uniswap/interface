import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import { ContextMenu, ContextMenuProps, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'

const COPY_CLOSE_DELAY = 400

export enum PoolContextMenuAction {
  CopyAddress = 'copyAddress',
  Share = 'share',
}

interface PoolOptionItemContextMenuProps {
  children: ReactNode
  poolId: string
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
  isOpen: boolean
  openMenu?: ContextMenuProps['openMenu']
  closeMenu: ContextMenuProps['closeMenu']
  actions: PoolContextMenuAction[]
  triggerMode?: ContextMenuTriggerMode
}

function _PoolOptionItemContextMenu({
  children,
  poolId,
  chainId,
  protocolVersion,
  isOpen,
  openMenu,
  closeMenu,
  actions,
  triggerMode = ContextMenuTriggerMode.Secondary,
}: PoolOptionItemContextMenuProps): JSX.Element {
  const { t } = useTranslation()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(poolId)

    setCopiedAddress(true)
    setTimeout(() => {
      setCopiedAddress(false)
      closeMenu()
    }, COPY_CLOSE_DELAY)
  }, [closeMenu, poolId])

  const onShare = useCallback(async () => {
    const url = UNISWAP_WEB_URL + getPoolDetailsURL(poolId, chainId)
    await setClipboard(url)
    setCopiedUrl(true)
    setTimeout(() => {
      setCopiedUrl(false)
      closeMenu()
    }, COPY_CLOSE_DELAY)
  }, [chainId, closeMenu, poolId])

  const dropdownOptions: MenuOptionItem[] = useMemo(() => {
    const options: MenuOptionItem[] = []

    if (actions.includes(PoolContextMenuAction.CopyAddress)) {
      const label =
        protocolVersion === ProtocolVersion.V4
          ? copiedAddress
            ? t('notification.copied.poolId')
            : t('common.copy.poolId')
          : copiedAddress
            ? t('notification.copied.address')
            : t('common.copy.address')
      options.push({
        onPress: onCopyAddress,
        label,
        Icon: copiedAddress ? CheckCircleFilled : CopyAlt,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: copiedAddress ? '$statusSuccess' : '$neutral2',
      })
    }

    if (actions.includes(PoolContextMenuAction.Share)) {
      options.push({
        onPress: onShare,
        label: copiedUrl ? t('notification.copied.linkUrl') : t('common.button.share'),
        Icon: copiedUrl ? CheckCircleFilled : ShareArrow,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: copiedUrl ? '$statusSuccess' : '$neutral2',
      })
    }

    return options
  }, [actions, protocolVersion, copiedAddress, t, onCopyAddress, onShare, copiedUrl])

  return (
    <ContextMenu
      triggerMode={triggerMode}
      menuItems={dropdownOptions}
      isOpen={isOpen}
      closeMenu={closeMenu}
      openMenu={openMenu}
      offsetY={4}
    >
      {children}
    </ContextMenu>
  )
}

export const PoolOptionItemContextMenu = React.memo(_PoolOptionItemContextMenu)
