import { CSSProperties, ReactNode, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import Tooltip from 'components/Tooltip'

const Dropdown = styled.div<{ placement?: string }>`
  display: none;
  position: absolute;
  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 12px;
  width: max-content;
  z-index: 13;
  top: 28px;

  ${({ placement }) =>
    placement === 'center'
      ? `
    left: 50%;
    transform: translate(-50%, 0);
    `
      : placement === 'right'
      ? `left: 100%;
        transform: translate(-100%, 0);
    `
      : ''}
`
const DropdownIcon = styled(DownSvg)`
  margin-left: 4px;

  transition: transform 300ms;
`

const HoverDropdownWrapper = styled.div<{ disabledHover: boolean; padding?: string }>`
  position: relative;
  display: inline-block;
  cursor: pointer;

  width: fit-content;
  padding: ${({ padding }) => padding || '8px 0'};

  :hover {
    ${Dropdown} {
      display: flex;
      flex-direction: column;
    }

    ${DropdownIcon} {
      transform: rotate(${({ disabledHover }) => (disabledHover ? '0' : '-180deg')});
    }
  }
`

const HoverDropdown = ({
  hideIcon = false,
  content,
  dropdownContent,
  padding,
  style = {},
}: {
  hideIcon?: boolean
  content: string | ReactNode
  dropdownContent: ReactNode
  padding?: string
  style?: CSSProperties
}) => {
  const [open, setOpen] = useState(false)

  return (
    <HoverDropdownWrapper
      disabledHover={!dropdownContent}
      padding={padding}
      style={style}
      onMouseOver={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Tooltip show={open} text={dropdownContent} placement="bottom" width="max-content">
        <Flex alignItems="center">
          {content}
          {!hideIcon && <DropdownIcon />}
        </Flex>
      </Tooltip>
    </HoverDropdownWrapper>
  )
}

export default HoverDropdown
