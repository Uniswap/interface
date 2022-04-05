import { useWeb3React } from '@web3-react/core'
import { GreyCard } from 'components/Card'
import { LightCard } from 'components/Card'
import { DarkCard } from 'components/Card'
import { BlueCard } from 'components/Card'
import Header from 'components/Header'
import { StackedContainer } from 'pages/AddLiquidity/styled'
import { ResponsiveHeaderText, Wrapper } from 'pages/RemoveLiquidity/styled'
import { useKiba } from 'pages/Vote/VotePage'
import React from 'react'
import { BarChart2, Check, ChevronRight, DollarSign, ExternalLink, List, X } from 'react-feather'
import { Card } from 'rebass'
import { TYPE } from 'theme'
import { StyledInternalLink } from 'theme/components'
import _ from 'lodash'
import styled from 'styled-components/macro'
export const Suite = React.memo(() => {
  const { account } = useWeb3React()
  const kibaBalance = useKiba(account)
  const isHolder = React.useMemo(() => {
    console.log(kibaBalance)
    return kibaBalance !== undefined ?  +kibaBalance?.toFixed(0) > 0 : false
  }, [kibaBalance])

  const url = `https://app.unicrypt.network/services`;
  const FrameText =  <p style={{height:'400px', display:'flex', width:'100%', color:"#222", justifyContent: 'center', alignItems:'center'}}>You must own Kiba Inu tokens to use this feature</p>
  const Header = styled.h1`
  font-family:"Bangers", cursive; 
  box-shadow:1px 1px .5px .5px #222;
  `
  return (
    <BlueCard style={{background:'radial-gradient(#f5b642, rgba(129,3,3,.95))',opacity:'.99', marginTop:-40, maxWidth:900}}>
      <div style={{display:'flex', justifyContent:'space-between', position:'sticky',  top:0, width:'100%'}}>
        <Header style={{color:'#FFF'}}>
          KibaTools&trade;
        </Header>
      </div>
          {isHolder && <iframe src={url} style={{height:'70vh', maxWidth:900, width: '100%', border: '1px solid transparent', borderRadius: 12}}/>} {!isHolder && <> {FrameText}</>}
          </BlueCard>
  )
})

Suite.displayName = "SUITE";