import { BarChart2, Check, ChevronRight, DollarSign, ExternalLink, List, X } from 'react-feather'
import { ResponsiveHeaderText, Wrapper } from 'pages/RemoveLiquidity/styled'

import { BlueCard } from 'components/Card'
import { Card } from 'rebass'
import { DarkCard } from 'components/Card'
import { GreyCard } from 'components/Card'
import Header from 'components/Header'
import { LightCard } from 'components/Card'
import React from 'react'
import { StackedContainer } from 'pages/AddLiquidity/styled'
import { StyledInternalLink } from 'theme/components'
import { TYPE } from 'theme'
import _ from 'lodash'
import styled from 'styled-components/macro'
import { useKiba } from 'pages/Vote/VotePage'
import { useWeb3React } from '@web3-react/core'

export const Suite = React.memo(() => {
  const { account } = useWeb3React()
  const kibaBalance = useKiba(account)
  const isHolder = React.useMemo(() => {
    return kibaBalance !== undefined ?  +kibaBalance?.toFixed(0) > 0 : false
  }, [kibaBalance])

  const url = `https://app.unicrypt.network/services`;
  const FrameText =  <p style={{fontFamily: 'Open Sans', height:'400px', display:'flex', width:'100%', justifyContent: 'center', alignItems:'center'}}>You must own Kiba Inu tokens to use this feature</p>
  const Header = styled.h1`
  font-family:"Open Sans"; 
  box-shadow:1px 1px .5px .5px #222;
  padding: 20px;
  `
  return (
    <BlueCard style={{opacity:'.99', marginTop:-40, maxWidth:900, borderRadius: 30 }}>
      <div style={{display:'flex', justifyContent:'space-between', position:'sticky',  top:0, width:'100%'}}>
        <Header style={{ fontWeight: 'normal'}}>
          KibaTools&trade;
        </Header>
      </div>
          {isHolder && <iframe src={url} style={{height:'70vh', maxWidth:900, width: '100%', border: '1px solid transparent', borderRadius: 12}}/>} {!isHolder && <> {FrameText}</>}
          </BlueCard>
  )
})

Suite.displayName = "SUITE";