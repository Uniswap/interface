import { SharedEventName } from '@uniswap/analytics-events'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import { atom, useAtom } from 'jotai'
import { useTheme } from 'lib/styled-components'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Loader } from 'ui/src/loading/Loader'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const TokensTab = lazy(() => import('components/AccountDrawer/MiniPortfolio/Tokens/TokensTab'))
const NFTsTab = lazy(() => import('components/AccountDrawer/MiniPortfolio/NFTs/NFTsTab'))
const PoolsTab = lazy(() => import('components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'))
const ActivityTab = lazy(() => import('components/AccountDrawer/MiniPortfolio/Activity/ActivityTab'))

const lastPageAtom = atom(0)

interface Page {
  title: string
  key: string
  component: ({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }) => JSX.Element
  loggingElementName: ElementName
}

export default function MiniPortfolio({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }) {
  const { t } = useTranslation()
  const theme = useTheme()

  // Resumes at the last viewed page
  const [lastPage, setLastPage] = useAtom(lastPageAtom)
  const [currentPage, setCurrentPage] = useState(lastPage)
  // biome-ignore lint/complexity/noVoid: Using void to explicitly discard the return value
  useEffect(() => void setLastPage(currentPage), [currentPage, setLastPage])

  const pages: Page[] = useMemo(
    () => [
      {
        title: t('common.tokens'),
        key: 'tokens',
        component: ({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }) => (
          <Suspense fallback={<Loader.Box />}>
            <TokensTab evmOwner={evmAddress} svmOwner={svmAddress} />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioTokensTab,
      },
      {
        title: t('common.nfts'),
        key: 'nfts',
        component: ({ evmAddress }: { evmAddress?: string }) => (
          <Suspense fallback={<Loader.Box />}>
            <NFTsTab owner={evmAddress ?? ' '} />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioNftTab,
      },
      {
        title: t('common.pools'),
        key: 'pools',
        component: ({ evmAddress }: { evmAddress?: string }) => (
          <Suspense fallback={<Loader.Box />}>
            <PoolsTab account={evmAddress ?? ''} />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioPoolsTab,
      },
      {
        title: t('common.activity'),
        key: 'activity',
        component: ({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }) => (
          <Suspense fallback={<Loader.Box />}>
            <ActivityTab evmOwner={evmAddress} svmOwner={svmAddress} />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioActivityTab,
      },
    ],
    [t],
  )

  const { component: Page, key: currentKey } = pages[currentPage]

  // Activity related fields
  const [activityUnread, setActivityUnread] = useState(false)
  const { hasPendingActivity } = usePendingActivity()

  useEffect(() => {
    if (hasPendingActivity && currentKey !== 'activity') {
      setActivityUnread(true)
    }
  }, [currentKey, hasPendingActivity])

  return (
    <Trace section={SectionName.MiniPortfolio}>
      <Flex mt="$spacing28" gap="$spacing12" height="100%">
        <Flex
          row
          gap="$spacing20"
          data-testid="mini-portfolio-navbar"
          $platform-web={{
            overflowX: 'auto',
          }}
        >
          {pages.map(({ title, loggingElementName, key }, index) => {
            const isUnselectedActivity = key === 'activity' && currentKey !== 'activity'
            const showActivityIndicator = isUnselectedActivity && (hasPendingActivity || activityUnread)
            const handleNavItemClick = () => {
              setCurrentPage(index)
              if (key === 'activity') {
                setActivityUnread(false)
              }
            }

            const active = currentPage === index

            return (
              <Trace logPress eventOnTrigger={SharedEventName.NAVBAR_CLICKED} element={loggingElementName} key={index}>
                <TouchableArea
                  alignItems="center"
                  shouldAutomaticallyInjectColors={false}
                  justifyContent="space-between"
                  onPress={handleNavItemClick}
                  key={key}
                  data-testid={loggingElementName}
                >
                  <Flex row gap="$spacing4" alignItems="center" justifyContent="center">
                    <Text
                      color={active ? '$neutral1' : '$neutral2'}
                      variant="subheading2"
                      hoverStyle={active ? { color: '$neutral1Hovered' } : { color: '$neutral2Hovered' }}
                    >
                      {title}
                    </Text>
                    {showActivityIndicator && hasPendingActivity && (
                      <Flex overflow="hidden">
                        <LoaderV2 />
                      </Flex>
                    )}
                    {showActivityIndicator && !hasPendingActivity && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="4" fill={theme.accent1} />
                      </svg>
                    )}
                  </Flex>
                </TouchableArea>
              </Trace>
            )
          })}
        </Flex>
        <Flex borderRadius="$rounded12" mx={-16} width="calc(100% + 32px)" data-testid="mini-portfolio-page">
          <Page evmAddress={evmAddress} svmAddress={svmAddress} />
        </Flex>
      </Flex>
    </Trace>
  )
}
