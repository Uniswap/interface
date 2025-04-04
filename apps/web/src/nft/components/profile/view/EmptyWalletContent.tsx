import { EmptyActivityIcon, EmptyNftsIcon, EmptyPoolsIcon, EmptyTokensIcon } from 'nft/components/profile/view/icons'
import { headlineMedium } from 'nft/css/common.css'
import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'

type EmptyWalletContent = {
  title: React.ReactNode
  subtitle: React.ReactNode
  actionText?: React.ReactNode
  urlPath?: string
  icon: React.ReactNode
}

type EmptyWalletContentType = 'nft' | 'token' | 'activity' | 'pool'

const EMPTY_WALLET_CONTENT: { [key in EmptyWalletContentType]: EmptyWalletContent } = {
  nft: {
    title: <Trans i18nKey="nfts.noneYet" />,
    subtitle: <Trans i18nKey="nft.buyTransferNFTToStart" />,
    actionText: <Trans i18nKey="nft.explore" />,
    urlPath: '/nfts',
    icon: <EmptyNftsIcon />,
  },
  token: {
    title: <Trans i18nKey="tokens.selector.empty.title" />,
    subtitle: <Trans i18nKey="nft.buyTransferTokensToStart" />,
    actionText: <Trans i18nKey="common.exploreTokens" />,
    urlPath: '/tokens',
    icon: <EmptyTokensIcon />,
  },
  activity: {
    title: <Trans i18nKey="common.noActivity" />,
    subtitle: <Trans i18nKey="nft.willAppearHere" />,
    icon: <EmptyActivityIcon />,
  },
  pool: {
    title: <Trans i18nKey="nft.noPools" />,
    subtitle: <Trans i18nKey="pool.openToStart" />,
    actionText: <Trans i18nKey="pool.newPosition.plus" />,
    urlPath: '/pool',
    icon: <EmptyPoolsIcon />,
  },
}

interface EmptyWalletContentProps {
  type?: EmptyWalletContentType
  onNavigateClick?: () => void
}

export const EmptyWalletModule = ({ type = 'nft', onNavigateClick }: EmptyWalletContentProps) => {
  const navigate = useNavigate()
  const content = EMPTY_WALLET_CONTENT[type]

  const actionButtonClick = useCallback(() => {
    if (content.urlPath) {
      onNavigateClick?.()
      navigate(content.urlPath)
    }
  }, [content.urlPath, navigate, onNavigateClick])

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      px="$spacing12"
      $sm={{ pt: '$spacing8' }}
    >
      {content.icon}
      <Text variant="subheading2" textAlign="center" mt="$spacing12" className={headlineMedium}>
        {content.title}
      </Text>
      <Text variant="body3" textAlign="center" mt="$spacing8" color="$neutral2">
        {content.subtitle}
      </Text>
      {content.actionText && (
        <Flex mt="$spacing20">
          <Button data-testid="nft-explore-nfts-button" variant="branded" onPress={actionButtonClick}>
            {content.actionText}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
