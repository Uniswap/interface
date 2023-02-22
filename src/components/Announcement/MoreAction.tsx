import { Trans } from '@lingui/macro'
import { MoreHorizontal, Trash } from 'react-feather'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import MenuFlyout from 'components/MenuFlyout'

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
const customStyle = css`
  padding: 16px;
  top: 3rem;
`
const MenuMoreAction = ({ showClearAll, clearAll }: { clearAll: () => void; showClearAll: boolean }) => {
  return (
    <MenuFlyout modalWhenMobile={false} trigger={<MoreHorizontal cursor="pointer" />} customStyle={customStyle}>
      <Column gap="16px">
        {showClearAll && (
          <MenuItem onClick={clearAll}>
            <Trash size={16} />
            <Trans>Clear All</Trans>
          </MenuItem>
        )}
      </Column>
    </MenuFlyout>
  )
}
export default MenuMoreAction
