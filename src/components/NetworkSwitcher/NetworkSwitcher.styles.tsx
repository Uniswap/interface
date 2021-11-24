import Popover from '../Popover'
import styled from 'styled-components'

// Network Switcher
export const StyledPopover = styled(Popover)`
  padding: 0;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
  overflow: hidden;
`

export const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  padding: 22px 22px 5px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
    `};
`

export const ChangeWalletButton = styled.button`
  width: 100%;
  padding: 20px 18px;
  font-weight: bold;
  font-size: 11px;
  line-height: 13px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1And2};
  border: none;
  outline: none;
  cursor: pointer;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 10px;
  `};
`

export const View = styled.div`
  max-width: 305px;
  padding: 22px;
`

export const Row = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
`

export const Text = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.text2};
  opacity: 0.8;
`

export const CloseButton = styled.button`
  padding: 0;
  margin-left: 16px;
  border: none;
  background: none;

  svg {
    stroke: ${({ theme }) => theme.text2};
  }
`

export const Image = styled.img`
  max-width: 100%;
`

export const NetworkTagRow = styled.div`
  display: flex;
  align-items: flex-start;
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  text-transform: uppercase;
  color: ${props => props.theme.purple3};
`
