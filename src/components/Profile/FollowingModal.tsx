import { PortfolioAvatar } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import Column from 'components/Column'
import useENS from 'hooks/useENS'
import { useFollowedAccounts } from 'pages/Profile'
import { ReactNode } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useModalIsOpen, useToggleFollowingModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'

const StyledModal = styled.div`
  position: fixed;
  display: flex;
  left: 50%;
  top: 50vh;
  transform: translate(-50%, -50%);
  width: 400px;
  height: fit-content;
  color: ${({ theme }) => theme.neutral1};
  font-size: 18px;
  padding: 20px 0px;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  z-index: 100;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.surface3};

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    max-height: 100vh;
  }
`

function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  return open ? <StyledModal>{children}</StyledModal> : null
}

const FlagsColumn = styled(Column)`
  max-height: 600px;
  overflow-y: auto;
  padding: 0px 20px;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    max-height: unset;
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
`

const CloseButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
`

const Header = styled(Row)`
  font-weight: 535;
  font-size: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  margin-bottom: 8px;
`

const Who = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
  align-items: center;
  margin-top: 15px;
`

const Following = ({ key, address, onClick }: { key: string; address: string; onClick: () => void }) => {
  const { name } = useENS(address)

  return (
    <Who key={key} onClick={onClick}>
      <PortfolioAvatar size={20} accountAddress={address} />
      <ThemedText.BodyPrimary>{name ?? shortenAddress(address)}</ThemedText.BodyPrimary>
    </Who>
  )
}

export default function FollowingModal() {
  const open = useModalIsOpen(ApplicationModal.FOLLOWING)
  const toggleModal = useToggleFollowingModal()
  const navigate = useNavigate()

  const following = useFollowedAccounts()

  return (
    <Modal open={open}>
      <FlagsColumn>
        <Header>
          Following
          <CloseButton onClick={toggleModal}>
            <X size={24} />
          </CloseButton>
        </Header>
        {following.map((address) => (
          <Following
            onClick={() => {
              toggleModal()
              navigate(`/account/${address}`)
            }}
            key={address}
            address={address}
          />
        ))}
      </FlagsColumn>
    </Modal>
  )
}
