import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Sell } from 'components/Icons/Sell'
import { Send } from 'components/Icons/Send'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import styled from 'lib/styled-components'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableStyle } from 'theme/components'
import { Flex } from 'ui/src'
import { t } from 'uniswap/src/i18n'

const TDPActionPill = styled.button<{ $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 48px;
  gap: 8px;
  border: none;
  border-radius: 50px;
  transition: color 0.2s;
  background-color: ${({ $color, theme }) => $color || theme.neutral2};
  color: ${({ theme }) => theme.neutralContrast};
  padding: 12px;
  font-size: 16px;
  font-weight: 535;
  flex-grow: 1;
  ${ClickableStyle}

  @media (max-width: 360px) {
    padding-left: 20px;
    > svg {
      display: none;
    }
  }
`

type TabItem = {
  label: string
  href: string
  icon: JSX.Element
}

export function TDPActionTabs() {
  const { currencyChain, currencyChainId, address, tokenColor } = useTDPContext()
  const switchChain = useSwitchChain()
  const navigate = useNavigate()
  const account = useAccount()
  const chainUrlParam = currencyChain.toLowerCase()
  const addressUrlParam = address === NATIVE_CHAIN_ID ? 'ETH' : address

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
      icon: <CreditCardIcon fill="white" />,
    },
    {
      label: t('common.sell.label'),
      href: `/swap?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
      icon: <Sell fill="white" />,
    },
    {
      label: t('common.send.button'),
      href: `/send?chain=${chainUrlParam}&inputCurrency=${addressUrlParam}`,
      icon: <Send fill="white" />,
    },
  ]
  return (
    <Flex row justifyContent="center" gap="$spacing8" width="100%">
      {tabs.map((tab) => (
        <TDPActionPill key={tab.label} onClick={() => toActionLink(tab.href)} $color={tokenColor}>
          {tab.icon}
          {tab.label}
        </TDPActionPill>
      ))}
    </Flex>
  )
}
