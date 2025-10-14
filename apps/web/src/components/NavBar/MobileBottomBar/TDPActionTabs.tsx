import { Send } from 'components/Icons/Send'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useActiveAccount, useConnectionStatus } from 'features/accounts/store/hooks'
import useSelectChain from 'hooks/useSelectChain'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, ButtonProps, Flex, IconButton, useMedia } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'

type TabItem = {
  label?: string
  href: string
  icon: JSX.Element
}

export function TDPActionTabs() {
  const { t } = useTranslation()
  const { currencyChain, currencyChainId, address, tokenColor } = useTDPContext()
  const selectChain = useSelectChain()
  const navigate = useNavigate()

  const currentConnectedChainId = useActiveAccount(currencyChainId)?.chainId
  const isConnected = useConnectionStatus(currencyChainId).isConnected

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
      {
        label: t('common.sell.label'),
        href: `/swap?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
        icon: <ArrowUpCircle />,
      },
      ...(isConnected
        ? [
            {
              href: `/send?sendChain=${chainUrlParam}&sendCurrency=${addressUrlParam}`,
              icon: <Send fill="currentColor" />,
            },
          ]
        : []),
    ],
    [t, chainUrlParam, addressUrlParam, isConnected],
  )
  return (
    <Flex row justifyContent="center" gap="$spacing8" width="100%">
      {tabs.map((tab, index) => {
        const commonProps = {
          key: tab.label || `icon-${index}`,
          onPress: () => toActionLink(tab.href),
          backgroundColor: tokenColor,
          size: 'medium',
        } as ButtonProps

        return tab.label ? (
          // biome-ignore lint/correctness/useJsxKeyInIterable: key is inside commeontProps
          <Button {...commonProps} icon={showIcons ? tab.icon : undefined}>
            {tab.label}
          </Button>
        ) : (
          // biome-ignore lint/correctness/useJsxKeyInIterable: key is inside commeontProps
          <IconButton {...commonProps} icon={tab.icon} />
        )
      })}
    </Flex>
  )
}
