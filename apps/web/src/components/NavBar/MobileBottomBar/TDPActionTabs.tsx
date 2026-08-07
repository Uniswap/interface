import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, useMedia } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { useModalState } from '~/hooks/useModalState'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPPermissionedState } from '~/pages/TokenDetails/hooks/useTDPPermissionedState'

const TDP_ACTION_TABS_MAX_WIDTH = 780

type TabItem = {
  label: string
  href: string
  icon: JSX.Element
}

export function TDPActionTabs() {
  const { t } = useTranslation()
  const { currencyChain, currencyChainId, address, tokenColor, multiChainMap, currency } = useTDPStore((s) => ({
    currencyChain: s.currencyChain,
    currencyChainId: s.currencyChainId,
    address: s.address,
    tokenColor: s.tokenColor,
    multiChainMap: s.multiChainMap,
    currency: s.currency,
  }))
  const selectChain = useSelectChain()
  const navigate = useNavigate()

  const currentConnectedChainId = useActiveAccount(currencyChainId)?.chainId

  // VerifyIdentityModal mounts in TDPSwapComponent (shared via redux modal state); only
  // render the CTA here to avoid double-mounting portals when both are in the tree.
  const tokenAddressForPermissions = currency && !currency.isNative ? currency.address : undefined
  const { isBlocked: isPermissionedBlocked } = useTDPPermissionedState({
    tokenAddress: tokenAddressForPermissions,
    chainId: currencyChainId,
  })
  const { openModal: openVerifyIdentityModal } = useModalState(ModalName.VerifyIdentity)

  const hasBalance = Boolean(multiChainMap[currencyChain]?.balance)

  const chainUrlParam = currencyChain.toLowerCase()
  const addressUrlParam = address === NATIVE_CHAIN_ID ? 'ETH' : address
  const media = useMedia()
  const showIcons = !media.xs

  const toActionLink = useCallback(
    async (href: string) => {
      if (currentConnectedChainId && currentConnectedChainId !== currencyChainId && isEVMChain(currencyChainId)) {
        await selectChain(currencyChainId)
      }
      navigate(href)
    },
    [currentConnectedChainId, currencyChainId, selectChain, navigate],
  )

  const tabs: TabItem[] = useMemo(
    () => [
      {
        label: t('common.buy.label'),
        href: `/swap/?chain=${chainUrlParam}&outputCurrency=${addressUrlParam}`,
        icon: <ArrowDownCircle />,
      },
      ...(hasBalance
        ? [
            {
              label: t('common.sell.label'),
              href: `/swap?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
              icon: <ArrowUpCircle />,
            },
          ]
        : []),
    ],
    [t, chainUrlParam, addressUrlParam, hasBalance],
  )

  if (isPermissionedBlocked) {
    return (
      <Flex row justifyContent="center" gap="$spacing8" width="100%" mx="auto" maxWidth={TDP_ACTION_TABS_MAX_WIDTH}>
        <Button
          onPress={openVerifyIdentityModal}
          backgroundColor={tokenColor}
          size="medium"
          icon={showIcons ? <UserCheck /> : undefined}
        >
          {t('permissionedPool.verifyIdentity.cta')}
        </Button>
      </Flex>
    )
  }

  return (
    <Flex row justifyContent="center" gap="$spacing8" width="100%" mx="auto" maxWidth={TDP_ACTION_TABS_MAX_WIDTH}>
      {tabs.map((tab) => (
        <Button
          key={tab.label}
          onPress={() => toActionLink(tab.href)}
          backgroundColor={tokenColor}
          size="medium"
          icon={showIcons ? tab.icon : undefined}
        >
          {tab.label}
        </Button>
      ))}
    </Flex>
  )
}
