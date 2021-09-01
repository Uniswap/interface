import React, { useRef } from 'react'
import styled from 'styled-components'
import { Network } from '.'
import TriangleIcon from '../../assets/svg/triangle.svg'
import Popover from '../../components/Popover'
import { RowBetween } from '../../components/Row'
import { TagSuccess } from '../../components/Tag'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useCloseModals, useModalOpen, useToggleModal } from '../../state/application/hooks'

const Section = styled.button`
  width: 100%;
  padding: 12px 19px 15px;
  background: ${({ theme }) => theme.bg1And2};
  border-radius: 12px;
  border: none;
  text-align: left;
  cursor: pointer;
`

const SmallLabel = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.purple2};
`

const Row = styled(RowBetween)`
  align-items: flex-start;
`

const IconWrapper = styled(RowBetween)`
  min-height: 36px;
  max-width: 36px;
  margin-bottom: 12px;

  img {
    max-width: 100%;
  }
`

const AssetName = styled.p`
  position: relative;
  display: inline-block;
  padding-right: 20px;
  margin: 5px 0 0;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text2};

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: url(${TriangleIcon}) center no-repeat;
    background-size: contain;
  }
`

const StyledPopover = styled(Popover)`
  padding: 0;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
  overflow: hidden;
`

const NetworksList = styled.ul`
  width: 182px;
  margin: 0;
  padding: 22px 24px;
  list-style: none;
`

const NetworkItem = styled.li`
  & + & {
    margin-top: 24px;
  }
`

const NetworkButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;

  img {
    height: 18px;
    width: 18px;
    margin-right: 8px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`

interface AssetSelectorProps {
  label: string
  modal: ApplicationModal
  connected?: boolean
  onNetworkClick: (network: Network) => void
  networks: Network[]
  selectedNetwork: Network
}

export const AssetSelector = ({
  label,
  connected,
  modal,
  onNetworkClick,
  networks,
  selectedNetwork
}: AssetSelectorProps) => {
  const switcherPopoverOpen = useModalOpen(modal)
  const toggleNetworkSwitcherPopover = useToggleModal(modal)

  const popoverRef = useRef(null)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (switcherPopoverOpen) closeModals()
  })

  return (
    <div ref={popoverRef}>
      <StyledPopover
        placement="bottom"
        show={switcherPopoverOpen}
        content={
          <NetworksList>
            {networks.map((network, index) => (
              <NetworkItem key={index}>
                <NetworkButton onClick={() => onNetworkClick(network)} disabled={network.name === selectedNetwork.name}>
                  <img src={network.icon} alt={`${network.name} logo`} />
                  {network.name}
                </NetworkButton>
              </NetworkItem>
            ))}
          </NetworksList>
        }
      >
        <Section onClick={toggleNetworkSwitcherPopover}>
          <Row>
            <IconWrapper>
              <img src={selectedNetwork.icon} alt={`${selectedNetwork.name} logo`} />
            </IconWrapper>
            {connected && <TagSuccess>Connected</TagSuccess>}
          </Row>
          <SmallLabel>{label}</SmallLabel>
          <AssetName>{selectedNetwork.name}</AssetName>
        </Section>
      </StyledPopover>
    </div>
  )
}
