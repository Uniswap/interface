import React from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import Switch from '../Switch'
import styled from 'styled-components'

const MarketsCard = styled.div`
  background: #ffffff;
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
`

const MarketsCardHeader = styled.div`
  display: flex;
  flex-flow: inherit;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 1rem 1.75rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`

const AssetWrap = styled.div`
  font-size: 1rem;
`

const AssetWrapLabels = styled.div`
  display: grid;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
  grid-template-columns: 4fr 3fr 3fr 2fr;
`

const AssetLabel = styled.div<{ textAlign?: string }>`
  font-size: 12px;
  font-weight: 500;
  color: #aab8c1;
  text-align: ${({ textAlign }) => (textAlign ? textAlign : 'center')};
`

const AssetItemWrap = styled.div`
  font-size: 1rem;
`

const AssetItem = styled.div<{ justifyItems?: string }>`
  display: grid;
  justify-items: ${({ justifyItems }) => (justifyItems ? justifyItems : 'end')};
  grid-template-columns: 4fr 3fr 3fr 2fr;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.25rem 1.75rem;
  border-left: 2px solid transparent;
  padding-left: 1.625rem;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: none;
  :hover {
    border-left: 2px solid #1de9b6;
    background: rgba(4, 169, 245, 0.05);
  }
`

function SupplyMarkets() {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  return (
    <div>
      <MarketsCard>
        <MarketsCardHeader>Supply</MarketsCardHeader>
        <AssetWrap>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>Asset</AssetLabel>
            <AssetLabel textAlign={'right'}>APY</AssetLabel>
            <AssetLabel textAlign={'right'}>Wallet</AssetLabel>
            <AssetLabel textAlign={'right'}>Collateral</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
      <MarketsCard style={{ marginTop: '1rem' }}>
        <AssetWrap>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>Asset</AssetLabel>
            <AssetLabel textAlign={'right'}>APY</AssetLabel>
            <AssetLabel textAlign={'right'}>Wallet</AssetLabel>
            <AssetLabel textAlign={'right'}>Collateral</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
            <AssetItem>
              <div style={{ justifySelf: 'start' }}>BTC</div>
              <div>0.01%</div>
              <div>0 BTC</div>
              <Switch />
            </AssetItem>
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default SupplyMarkets
