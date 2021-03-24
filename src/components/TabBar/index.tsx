import React, { ReactNode } from 'react'
import styled from 'styled-components'

const TabContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 50px;
  overflow-x: auto;
`

const TabButton = styled.button<{ active: boolean }>`
  width: auto;
  cursor: pointer;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  background: transparent;
  margin-right: 20px;
  &:focus {
    outline: none;
  }
`

const Title = styled.span<{ active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: inherit;
  font-size: 18px;
  color: ${props => (props.active ? props.theme.text4 : props.theme.text5)};
  transition: 0.3s;
  padding-bottom: 4px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  border-bottom-color: ${props => (props.active ? props.theme.text4 : 'transparent')};
  white-space: nowrap;
`

interface TabBarProps {
  titles: ReactNode[]
  active: number
  onChange: (newActiveTab: number) => void
}

export default function TabBar({ titles, active, onChange }: TabBarProps) {
  return (
    <TabContainer>
      {titles.map((title, index) => (
        <TabButton key={index} onClick={() => onChange(index)} active={active === index}>
          <Title active={active === index}>{title}</Title>
        </TabButton>
      ))}
    </TabContainer>
  )
}
