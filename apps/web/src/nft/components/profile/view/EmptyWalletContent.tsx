import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from 'ui/src'
import { EmptyActivityIcon } from 'ui/src/components/icons/EmptyActivityIcon'
import { EmptyNftsIcon } from 'ui/src/components/icons/EmptyNftsIcon'
import { EmptyPoolsIcon } from 'ui/src/components/icons/EmptyPoolsIcon'
import { EmptyTokensIcon } from 'ui/src/components/icons/EmptyTokensIcon'
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
    icon: <EmptyNftsIcon size={115} />,
  },
  token: {
    title: <Trans i18nKey="tokens.selector.empty.title" />,
    subtitle: <Trans i18nKey="nft.buyTransferTokensToStart" />,
    actionText: <Trans i18nKey="common.exploreTokens" />,
    urlPath: '/tokens',
    icon: <EmptyTokensIcon size={115} />,
  },
  activity: {
    title: <Trans i18nKey="common.noActivity" />,
    subtitle: <Trans i18nKey="nft.willAppearHere" />,
    icon: <EmptyActivityIcon size={115} />,
  },
  pool: {
    title: <Trans i18nKey="nft.noPools" />,
    subtitle: <Trans i18nKey="pool.openToStart" />,
    actionText: <Trans i18nKey="pool.newPosition.plus" />,
    urlPath: '/pool',
    icon: <EmptyPoolsIcon size={115} />,
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
      paddingLeft="$spacing32"
      paddingRight="$spacing32"
      $sm={{ paddingTop: '$spacing8' }}
    >
      {content.icon}
      <Text variant="subheading1" textAlign="center" marginTop="$spacing12">
        {content.title}
      </Text>
      <Text
        variant="body2"
        textAlign="center"
        marginTop="$spacing8"
        color="$neutral2"
        $platform-web={{ textWrap: 'pretty' }}
      >
        {content.subtitle}
      </Text>
      {content.actionText && (
        <Flex marginTop="$spacing20">
          <Button data-testid="nft-explore-nfts-button" variant="branded" onPress={actionButtonClick}>
            {content.actionText}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
