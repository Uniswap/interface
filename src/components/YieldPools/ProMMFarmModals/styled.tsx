import { Text } from 'rebass'
import styled from 'styled-components'

export const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

export const Title = styled(Text)<{ border?: boolean }>`
  font-size: 20px;
  line-height: 32px;
  font-weight: 500;
  border-bottom: 0.5px dashed ${({ theme, border }) => (border ? theme.subText : 'transparent')};
`

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 18px 90px 1.5fr repeat(3, 1fr);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: ${({ theme }) => theme.tableHeader};
  gap: 16px;
  font-size: 12px;
  text-transform: uppercase;
  margin-top: 16px;
  padding: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 18px 1fr 1fr;
   `}
`

export const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  border-radius: 0;
  text-transform: none;
  margin-top: 0;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  border-bottom: 1px solid ${({ theme }) => theme.border};
`

export const Checkbox = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.primary};

  :indeterminate::before {
    content: '';
    display: block;
    color: ${({ theme }) => theme.textReverse};
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.primary};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border: solid ${({ theme }) => theme.textReverse};
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }

  :disabled {
    background-color: ${({ theme }) => theme.disableText};
  }
`

export const Select = styled.div`
  cursor: pointer;
  width: 180px;
  border-radius: 4px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin-top: 16px;
  `}
`

export const SelectMenu = styled.div`
  position: absolute;
  top: 40px;
  left: 0;
  width: 180px;
  border-radius: 8px;
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  z-index: 10;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

export const SelectOption = styled.div`
  padding: 12px;
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const DropdownIcon = styled.div<{ rotate?: boolean }>`
  transform: rotate(${({ rotate }) => (rotate ? '-180deg' : '0')});
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${({ theme }) => theme.text};

  transition: transform 300ms;
  transform: rotate(${({ rotate }) => (rotate ? '-180deg' : '0')});
`
