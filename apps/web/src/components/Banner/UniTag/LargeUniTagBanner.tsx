import Column from 'components/Column'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { Buttons, Copy, Profile } from '.'
import { PopupContainer } from '../shared/styled'
import pfp1 from './assets/pfp1.png'
import pfp2 from './assets/pfp2.png'
import pfp3 from './assets/pfp3.png'
import pfp4 from './assets/pfp4.png'
import { useUniTagBanner } from './useUniTagBanner'

const StyledPopupContainer = styled(PopupContainer)`
  height: 176px;
  width: 390px;
  right: 28px;
  bottom: 46px;
  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    height: 150px;
    width: 369px;
    right: unset;
    left: unset;
    bottom: 73px;
  }
  @media screen and (max-width: ${BREAKPOINTS.xs}px) {
    height: 150px;
    width: 90%;
  }
  @media screen and (max-width: 305px) {
    display: none;
  }
  border: none;
  background: none;
  overflow: hidden;
`
const ContentContainer = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  overflow: hidden;
`
const CopyContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  height: 68px;
  width: 280px;
  gap: 4px;
  @media screen and (max-width: ${BREAKPOINTS.xs}px) {
    width: 90%;
  }
`
const ButtonsContainer = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  gap: 12px;
  z-index: 1;
  width: calc(100% - 32px);
`
const GraphicsContainer = styled(Column)`
  position: absolute;
  opacity: 0.8;
  gap: 7px;
  top: 12px;
  right: 19px;
  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    top: 12px;
    right: 38px;
  }
  @media screen and (max-width: ${BREAKPOINTS.xs}px) {
    display: none;
  }
`
export function LargeUniTagBanner() {
  const { shouldHideUniTagBanner, handleAccept, handleReject } = useUniTagBanner()

  return (
    <StyledPopupContainer show={!shouldHideUniTagBanner} data-testid="large-unitag-banner">
      <ContentContainer>
        <CopyContainer>
          <Copy large />
        </CopyContainer>
        <ButtonsContainer>
          <Buttons large onAccept={handleAccept} onReject={handleReject} />
        </ButtonsContainer>
      </ContentContainer>
      <GraphicsContainer>
        <Profile pfp={pfp1} name="maggie" color="#67bcff" rotation={-2} offset={5} large />
        <Profile pfp={pfp2} name="hayden" color="#8CD698" rotation={3} offset={-94} large />
        <Profile pfp={pfp3} name="unicorn" color="#E89DE5" rotation={-2} offset={5} large />
        <Profile pfp={pfp4} name="bryan" color="#FE7C00" rotation={-2} offset={-78} large />
      </GraphicsContainer>
    </StyledPopupContainer>
  )
}
