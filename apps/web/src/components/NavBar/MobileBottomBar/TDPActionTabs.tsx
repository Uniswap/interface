import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Sell } from 'components/Icons/Sell'
import { Send } from 'components/Icons/Send'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Flex, useMedia } from 'ui/src'

type TabItem = {
  label: string
  href: string
  icon: JSX.Element
}

export function TDPActionTabs() {
  const { t } = useTranslation()
  const { currencyChain, currencyChainId, address, tokenColor } = useTDPContext()
  const switchChain = useSwitchChain()
  const navigate = useNavigate()
  const account = useAccount()
  const chainUrlParam = currencyChain.toLowerCase()
  const addressUrlParam = address === NATIVE_CHAIN_ID ? 'ETH' : address
  const media = useMedia()
  const showIcons = !media.xs

  const toActionLink = useCallback(
    async (href: string) => {
      if (account.chainId && account.chainId !== currencyChainId) {
        await switchChain(currencyChainId)
      }
      navigate(href)
    },
    [account, currencyChainId, switchChain, navigate],
  )

  const tabs: TabItem[] = [
    {
      label: t('common.buy.label'),
      href: `/swap/?chain=${chainUrlParam}&outputCurrency=${addressUrlParam}`,
      icon: <CreditCardIcon fill="currentColor" />,
    },
    {
      label: t('common.sell.label'),
      href: `/swap?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
      icon: <Sell fill="currentColor" />,
    },
    {
      label: t('common.send.button'),
      href: `/send?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
      icon: <Send fill="currentColor" />,
    },
  ]
  return (
    <Flex row justifyContent="center" gap="$spacing8" width="100%">
      {tabs.map((tab) => (
        <Button
          key={tab.label}
          onPress={() => toActionLink(tab.href)}
          backgroundColor={tokenColor}
          icon={showIcons ? tab.icon : undefined}
          size="medium"
        >
          {tab.label}
        </Button>
      ))}
    </Flex>
  )
}
