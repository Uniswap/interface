import React, { ReactNode, useRef } from 'react'
import styled from 'styled-components';
import Popover from '../Popover';
import traingleIcon from '../../assets/svg/triangle-bridght-left.svg';
import { ButtonPrimary } from '../Button';
import arbitrumLogo from '../../assets/images/arbitrum-logo-light.svg';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useCloseModals, useModalOpen } from '../../state/application/hooks';
import { ApplicationModal } from '../../state/application/actions';

const StyledPopover = styled(Popover)`
  max-width: 290px;
  padding: 22px;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
`;

const AddButton = styled(ButtonPrimary)`
  height: 40px;
  margin-bottom: 24px;

  img {
    margin-right: 10px;
  }
`;


const BackButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  font-weight: bold;
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  text-align: left;
  text-transform: uppercase;
  color: #C0BAF7;
  background: none;
  cursor: pointer;

  img {
    margin-right: 6px;
  }
`;

const Text = styled.p`
  margin: 0 0 24px;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.text2};
  opacity: 0.8;
`;

export const AddArbitrumPopover = ({ children }: { children: ReactNode }) => {
  const popoverRef = useRef(null)
  const AddArbitrumPopoverOpen = useModalOpen(ApplicationModal.ADD_ARBITRUM)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (AddArbitrumPopoverOpen) closeModals()
  })
  
  return (
    <div ref={popoverRef}>
      <StyledPopover
        content={
          <>
            <Text>It looks like your wallet is not connected to Arbitrum network.</Text>
            <AddButton>
              <img src={arbitrumLogo} alt="logo"/>
              add arbitrum
            </AddButton>
            <BackButton>
              <img src={traingleIcon} alt="triangle"/>
              Change Network
            </BackButton>
          </>
        }
        show={AddArbitrumPopoverOpen}
      >
        {children}
      </StyledPopover>
    </div>
  )
}
