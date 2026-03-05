import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, useMedia } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import useSelectChain from '~/hooks/useSelectChain'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

const TDP_ACTION_TABS_MAX_WIDTH = 780

type TabItem = {
  label: string
  href: string
  icon: JSX.Element
}

export function TDPActionTabs() {
  const { t } = useTranslation()
  const { currencyChain, currencyChainId, address, tokenColor, multiChainMap } = useTDPContext()
  const selectChain = useSelectChain()
  const navigate = useNavigate()

  const currentConnectedChainId = useActiveAccount(currencyChainId)?.chainId

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
