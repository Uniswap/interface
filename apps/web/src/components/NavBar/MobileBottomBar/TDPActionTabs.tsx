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
import { DeprecatedButton, Flex, styled, Text, useMedia } from 'ui/src'
import { getContrastPassingTextColor } from 'uniswap/src/utils/colors'

const TDPActionPill = styled(DeprecatedButton, {
  size: 'medium',
  borderRadius: 50,
  flexGrow: 1,
  fontSize: '$medium',
  fontWeight: '$large',
  height: 48,
  hoverStyle: {
    filter: 'brightness(0.85)',
  },
})

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
  const textColor = tokenColor && getContrastPassingTextColor(tokenColor)
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
        <TDPActionPill
          key={tab.label}
          onPress={() => toActionLink(tab.href)}
          backgroundColor={tokenColor}
          hoverStyle={{ backgroundColor: tokenColor }}
          pressStyle={{ backgroundColor: tokenColor }}
          color={textColor}
        >
          <Flex row gap="$spacing8" alignItems="center">
            {showIcons && (
              <Text color={textColor} display="flex">
                {tab.icon}
              </Text>
            )}
            <Text color={textColor}>{tab.label}</Text>
          </Flex>
        </TDPActionPill>
      ))}
    </Flex>
  )
}
