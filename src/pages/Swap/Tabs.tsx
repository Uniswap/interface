import React from 'react'
import styled from 'styled-components'
import Row from '../../components/Row'
import { ReactComponent as EcoRouter } from '../../assets/images/eco-router.svg'

export const Tabs = () => {
  return (
    <TabsColumn>
      <TabsRow>
        <Button className="active">
          <StyledEcoRouter />
          Eco Router V1.5
        </Button>
        <Button disabled={true}>Limit</Button>
        <Button disabled={true}>Bridge Swap</Button>
      </TabsRow>
    </TabsColumn>
  )
}

const TabsColumn = styled.div`
  max-width: 432px;
  width: 100%;
`

const TabsRow = styled(Row)`
  display: inline-flex;
  width: auto;
  margin: 0 0 10px;
  padding: 2px;
  background: #191a24;
  border-radius: 12px;
`

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 7px 10px;
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
    font-size: 12px;
    line-height: 14px;
  }

  &:disabled {
    color: #504d72;
    cursor: not-allowed;
  }
`

const StyledEcoRouter = styled(EcoRouter)`
  margin-right: 5px;
`
