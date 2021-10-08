import React from 'react'
import styled from 'styled-components'
import { NumberBadge } from '../../components/NumberBadge'
import Row from '../../components/Row'

interface TabsProps {
  selectedTab: string
  onTabClick: (tab: string) => void
  isCollectDisabled: boolean
  collectAmount: number
}

const tabs = ['Bridge', 'Collect']

export const Tabs = ({ selectedTab, onTabClick, isCollectDisabled, collectAmount }: TabsProps) => {
  return (
    <TabsRow>
      {tabs.map((tab, index) => {
        const isCollectTab = tab === 'Collect'

        return (
          <Button
            key={index}
            onClick={() => onTabClick(tab)}
            className={selectedTab === tab ? 'active' : ''}
            disabled={isCollectTab && isCollectDisabled}
          >
            {tab}
            {isCollectTab && <Badge badgeTheme="green">{collectAmount}</Badge>}
          </Button>
        )
      })}
    </TabsRow>
  )
}

const TabsRow = styled(Row)`
  position: absolute;
  top: -10px;
  left: 0;
  width: auto;
  transform: translateY(-100%);
  padding: 2px;
  background: #191a24;
  border-radius: 12px;
`

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 8.5px 10px;
  font-weight: 600;
  font-size: 11px;
  line-height: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8780bf;
  border-radius: 10px;
  border: none;
  background: none;
  cursor: pointer;

  &.active {
    color: #ffffff;
    background: #2a2f42;
  }

  &:disabled {
    color: #504d72;
    cursor: not-allowed;
  }
`

const Badge = styled(NumberBadge)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 6px;
`
