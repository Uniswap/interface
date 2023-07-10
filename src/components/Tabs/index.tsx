
import { Trans } from "@lingui/macro";
import React, { useCallback } from "react"
import styled from "styled-components"
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { ActiveSwapTab } from "state/swap/actions";
// import Styles from "./tabs.styles.less";


const TabContainer = styled.div;

const TabHeader = styled.div<{ isActive: boolean, first: boolean, last: boolean}>`
  padding: 10px 20px;
  background-color: ${({ theme, isActive }) => isActive ? theme.backgroundSurface : theme.background};
  cursor: pointer;
  // border-radius: 10px;
  border-top-left-radius: ${({first}) => first ? "8px" : "0"};
  border-top-right-radius: ${({last}) => last ? "8px" : "0"};
  color: ${({ theme, isActive }) => (isActive ? theme.textSecondary : theme.textTertiary)};
  font-size: 16px;
  font-weight: 500;

  :hover {
    user-select: initial;
    color: ${({ theme }) => theme.textSecondary};
  }
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

export const TabNavItem =  ({ id, activeTab, setActiveTab, first, last, children }: {
  id: number,
  activeTab: number,
  setActiveTab: (id: number) => void,
  children: React.ReactNode,
  first?: boolean,
  last?: boolean
}) => {
    const handleClick = useCallback(() => {
      setActiveTab(id);
    }, [id, setActiveTab]);
    
   return (
      <TabHeader isActive={id === activeTab} onClick={handleClick} first={first ?? false} last={last ?? false}>
        { children }
      </TabHeader>
    );
   };

