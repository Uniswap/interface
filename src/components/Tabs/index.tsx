
import { Trans } from "@lingui/macro";
import React, { useCallback } from "react"
import styled from "styled-components"
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { ActiveSwapTab } from "state/swap/actions";
// import Styles from "./tabs.styles.less";


const TabContainer = styled.div;

const TabHeader = styled.div<{ isActive: boolean}>`
  padding: 10px 20px;
  background-color: ${({ theme, isActive }) => isActive ? theme.background : 'black'};
  cursor: pointer;
  border-radius: 10px;

`


// the order of displayed base currencies from left to right is always in sort order
// currencyA is treated as the preferred base currency
export default function SwapTabHeader({
  activeTab,
  handleSetTab
}: {
  activeTab: number,
  handleSetTab: () => void
}) {
  const isTrade = activeTab == ActiveSwapTab.TRADE
  return (
    <div style={{ width: 'fit-content', display: 'flex', alignItems: 'center' }} onClick={handleSetTab}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={isTrade} fontSize="20px">
          <Trans>Trade</Trans>
        </ToggleElement>
        <ToggleElement isActive={!isTrade} fontSize="20px">
          <Trans>Borrow</Trans>
        </ToggleElement>
      </ToggleWrapper>
    </div>
  )
}

export const TabContent = ({id, activeTab, children}: {
  id: number,
  activeTab: number,
  children: React.ReactNode
}) => {
 return (
   activeTab === id ?
   <div>
      {children}
   </div>
   : null
 );
};

export const TabNavItem =  ({ id, activeTab, setActiveTab, children }: {
  id: number,
  activeTab: number,
  setActiveTab: (id: number) => void,
  children: React.ReactNode
}) => {
    const handleClick = useCallback(() => {
      setActiveTab(id);
    }, [id, setActiveTab]);
    
   return (
      <TabHeader isActive={id === activeTab} onClick={handleClick}>
        { children }
      </TabHeader>
    );
   };

