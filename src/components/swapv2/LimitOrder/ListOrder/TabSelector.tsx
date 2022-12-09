import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { LimitOrderStatus } from '../type'

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  user-select: none;
  border-radius: 20px;
  transition: all 150ms;
  ${({ isActive, theme }) =>
    isActive &&
    css`
      font-weight: 500;
      text-align: center;
      color: ${theme.text};
      background: ${theme.buttonGray};
    `}
`
const TabSelector = ({
  className,
  activeTab,
  setActiveTab,
}: {
  className?: string
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  return (
    <Flex className={className}>
      <TabItem
        isActive={activeTab === LimitOrderStatus.ACTIVE}
        role="button"
        onClick={() => {
          setActiveTab(LimitOrderStatus.ACTIVE)
        }}
      >
        <Trans>Active Orders</Trans>
      </TabItem>
      <TabItem
        isActive={activeTab === LimitOrderStatus.CLOSED}
        role="button"
        onClick={() => {
          setActiveTab(LimitOrderStatus.CLOSED)
        }}
      >
        <Trans>Orders History</Trans>
      </TabItem>
    </Flex>
  )
}
export default TabSelector
