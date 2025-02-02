import styled from 'lib/styled-components'
import { EmptyActivityIcon, EmptyNftsIcon, EmptyPoolsIcon, EmptyTokensIcon } from 'nft/components/profile/view/icons'
import { headlineMedium } from 'nft/css/common.css'
import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'

const EmptyWalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  height: 100%;
  width: 100%;
`

const EmptyWalletText = styled(ThemedText.SubHeader)`
  white-space: normal;
  margin-top: 12px;
  text-align: center;
`

const EmptyWalletSubtitle = styled(ThemedText.BodySmall)`
  white-space: normal;
  text-align: center;
  margin-top: 8px;
`

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.accent1};
  padding: 10px 24px;
  color: ${({ theme }) => theme.white};
  width: min-content;
  border: none;
  outline: none;
  border-radius: 12px;
  white-space: nowrap;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 535;
  font-size: 16px;
  line-height: 24px;
`

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

const EmptyWalletContent = ({ type = 'nft', onNavigateClick }: EmptyWalletContentProps) => {
  const navigate = useNavigate()

  const content = EMPTY_WALLET_CONTENT[type]

  const actionButtonClick = useCallback(() => {
    if (content.urlPath) {
      onNavigateClick?.()
      navigate(content.urlPath)
    }
  }, [content.urlPath, navigate, onNavigateClick])

  return (
    <>
      {content.icon}
      <EmptyWalletText className={headlineMedium}>{content.title}</EmptyWalletText>
      <EmptyWalletSubtitle color="neutral2">{content.subtitle}</EmptyWalletSubtitle>
      {content.actionText && (
        <ActionButton data-testid="nft-explore-nfts-button" onClick={actionButtonClick}>
          {content.actionText}
        </ActionButton>
      )}
    </>
  )
}

export const EmptyWalletModule = (props?: EmptyWalletContentProps) => {
  return (
    <EmptyWalletContainer>
      <EmptyWalletContent {...props} />
    </EmptyWalletContainer>
  )
}
