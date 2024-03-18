import { Trans } from '@lingui/macro'
import walletAppPromoBannerQR from 'assets/images/walletAnnouncementBannerQR.png'
import { ReactComponent as AppStoreBadge } from 'assets/svg/app-store-badge.svg'
import { ReactComponent as PlayStoreBadge } from 'assets/svg/play-store-badge.svg'
import { ColumnCenter } from 'components/Column'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

const StyledModal = styled(Modal)`
  display: block;
`
const Wrapper = styled.div`
  position: relative;
  padding: 60px 32px 32px 32px;
  width: 100%;
  user-select: none;
`
const CloseIcon = styled(X)`
  width: 25px;
  height: 25px;
  stroke: ${({ theme }) => theme.neutral2};
`
const CloseButton = styled.div`
  width: 32px;
  height: 32px;
  position: absolute;
  top: 28px;
  right: 23px;
  border-radius: 160px;
  padding: 4px;
  cursor: pointer;
  background: ${({ theme }) => theme.surface3};
  :hover {
    ${CloseIcon} {
      stroke: ${({ theme }) => theme.neutral1};
    }
  }
`
const StyledQRCode = styled.img`
  width: 150px;
  height: 150px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
`
const BadgeLink = styled(ExternalLink)`
  stroke: none;
  :hover {
    opacity: 1;
  }
`
export function GetTheAppModal() {
  const isOpen = useModalIsOpen(ApplicationModal.GET_THE_APP)
  const closeModal = useCloseModal()
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => (isOpen ? closeModal(ApplicationModal.GET_THE_APP) : undefined))

  return (
    <StyledModal isOpen={isOpen} maxWidth={486} slideIn>
      <Wrapper ref={ref}>
        <CloseButton onClick={() => closeModal(ApplicationModal.GET_THE_APP)} data-testid="get-the-app-close-button">
          <CloseIcon />
        </CloseButton>
        <ColumnCenter gap="xl">
          <ColumnCenter gap="sm">
            <ThemedText.H1Medium textAlign="center">
              <Trans>Download the Uniswap app</Trans>
            </ThemedText.H1Medium>
            <ThemedText.BodySecondary textAlign="center" maxWidth="400px">
              <Trans>Scan the QR code with your phone to download the Uniswap app</Trans>
            </ThemedText.BodySecondary>
          </ColumnCenter>
          <BadgeLink href="https://uniswapwallet.onelink.me/8q3y/m4i9qsez?af_qr=true">
            <StyledQRCode src={walletAppPromoBannerQR} alt="App OneLink QR code" />
          </BadgeLink>
          <Row justify="center" gap="16px">
            <BadgeLink href="https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476">
              <AppStoreBadge />
            </BadgeLink>
            <BadgeLink href="https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share">
              <PlayStoreBadge />
            </BadgeLink>
          </Row>
        </ColumnCenter>
      </Wrapper>
    </StyledModal>
  )
}
