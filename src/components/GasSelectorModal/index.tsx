import { CheckCircle, RefreshCw, X } from "react-feather";
import { CloseIcon, TYPE } from "theme";
import React, { RefObject } from 'react'
import { RowBetween, RowFixed } from "components/Row";
import { useSetUserGasPreference, useUserGasPreference } from "state/user/hooks";

import { AutoColumn } from "components/Column";
import Badge from "components/Badge";
import { ButtonError } from "components/Button";
import Card from "components/Card";
import Modal from "components/Modal";
import QuestionHelper from "components/QuestionHelper";
import Toggle from "components/Toggle";
import { Trans } from "@lingui/react";
import axios from "axios";
import {darken}from'polished'
import { error } from "console";
import { isMobile } from "react-device-detect";
import styled from "styled-components/macro";

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  overflow:hidden;
  background: ${props => props.theme.bg0};
  color: ${props => props.theme.text1};
`

type GasSelectorProps = {
    isOpen: boolean;
    onDismiss: () => void;

}

const StyledAutoColumn = styled(AutoColumn)`
padding:1px;
&:hover {
    border: 1px solid lightgreen !important;
    transition: ease in all 0.055s;
}
`

const ToolbarItem = styled(AutoColumn)`
 cursor: pointer;
 padding:9px;
 transition: ease all 0.2s;
 &:hover{
     > * { 
         background:#ccc; color: #222;  transition: ease all 0.2s;
     }
 }
`;

const StyledBadge = styled(Badge)<{active?:boolean}>`
color: ${({theme, active}) => active ? theme.primary2 : theme.text1};
 &:hover {
   color: ${({active, theme}) => active ? theme.text1 : `${theme.text1}`} !important;
   background: ${props => darken(0.1, props?.color || props.theme.bg0)};
   transition: ease all 0.1s;
   cursor: pointer;
 }
`

const StyledInput = styled.input`
padding: 9px 14px;
 &:hover {
   border: 1px solid ${props => props.theme.text1} !important;
 }

 &:focus {
   border: 1px solid ${props => props.theme.text1} !important;
   outline:${props => props.theme.text1} 1px;
 }
 &:focus-visible{
  border: 1px solid ${props => props.theme.text1} !important;
  outline: ${props => props.theme.text1} 1px;
 }
`

export const GasSelectorModal = (props: GasSelectorProps) => {
    const {isOpen, onDismiss} = props;

    async function getCurrentGasPrices() {
        const fetchEndpoint = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=2SIRTH18CHU6HM22AGRF1XE9M7AKDR9PM7`
        const response = await axios.get(fetchEndpoint);
        const prices = {
          low: response.data.result.SafeGasPrice,
          medium: response.data.result.ProposeGasPrice,
          // add 5 to the recommended gas produced by etherscan..
          high: (parseInt(response.data.result.FastGasPrice) + 5),
          ultra: (parseInt(response.data.result.FastGasPrice) + 12)
        };
        return prices;
    }
    const inputRef = React.useRef<HTMLInputElement> ()
    const [prices, setPrices] = React.useState<any>()
    const gasSettings = useUserGasPreference()
    const setUserGasSettings = useSetUserGasPreference()
    const [view, setView] = React.useState<'advanced' | 'basic'>(gasSettings?.custom && gasSettings?.custom > 0 ? 'advanced' : 'basic')
    const fetchGasPrices = ( ) => getCurrentGasPrices().then(setPrices)
    const customGas = gasSettings?.custom && gasSettings?.custom > 0 ? gasSettings?.custom : undefined
    
    React.useEffect(() => {
        fetchGasPrices()  
    }, [isOpen])

    React.useEffect(() => {
      if (isOpen && view === 'advanced') {
        inputRef.current && inputRef.current?.focus()
      }
    }, [isOpen,   view])

    const updateToBasicView = () => setView('basic')
    const updateToAdvancedView = () => setView('advanced')

    const updateSettingsForLow = () => {
        setUserGasSettings({...gasSettings, low: true, medium: false, high: false, ultra: false })
    }

    const updateSettingsForMed = () => {
        setUserGasSettings({...gasSettings, low: false, medium: true, high: false, ultra: false })
    }

    const updateSettingsForHigh = () => {
        setUserGasSettings({...gasSettings, low: false, medium: false, high: true, ultra: false })
    }


    const updateSettingsForUltra = () => {
      setUserGasSettings({...gasSettings, low: false, medium: false, high: false, ultra: true })
  }


    const onChangeOfGas = (e: any) => {
        setUserGasSettings({...gasSettings, custom: e.target.value });
    }

    const resetToDefaults = () => {
        setUserGasSettings({low:false,medium:false,high:false, custom: undefined, ultra: false})
    }

    const refreshGasPrices = () => {
        fetchGasPrices()
    }

    const toggleUseCustomGweiOnce = () => {
      setUserGasSettings({...gasSettings, useOnce: !gasSettings?.useOnce })
    }

    const clearCustomGwei = () => {
      setUserGasSettings({...gasSettings, custom: undefined })
      if(inputRef.current) inputRef.current.value = ``
    }

    const showClearCustomGwei = Boolean(gasSettings && gasSettings?.custom && gasSettings?.custom > 0)
    return (
        <Modal size={600} maxHeight={600}  isOpen={isOpen} onDismiss={onDismiss}>
             <ContentWrapper gap="sm">
          <RowBetween>
            <TYPE.mediumHeader>
              <>Gas Settings</><br/>
              <small>Select your preferred gas settings below</small>
            </TYPE.mediumHeader>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <RowFixed style={{borderBottom: `1px solid #444`, width:'100%', paddingBottom:10, marginBottom:15, columnGap: 15}}>
              <StyledBadge active={view === 'basic'} style={{cursor: 'pointer'}} onClick={updateToBasicView}>Basic{view === 'basic' && <><CheckCircle fontSize={14} style={{marginLeft:5}}/> </>}</StyledBadge>
              <StyledBadge  active={view === 'advanced'}  style={{cursor: 'pointer'}} onClick={updateToAdvancedView}>Advanced{view === 'advanced' && <><CheckCircle fontSize={14} style={{marginLeft:5}}  /></> }</StyledBadge>
          </RowFixed>
          {view === 'basic' && <div style={{display:'flex', justifyContent:'center', alignItems: 'center', columnGap:10}}>
              <ToolbarItem onClick={refreshGasPrices}><Badge>Refresh Gas &nbsp;<RefreshCw /></Badge></ToolbarItem>
              { Boolean(gasSettings?.ultra || gasSettings?.high || gasSettings?.low || gasSettings?.medium) && <ToolbarItem onClick={resetToDefaults}><Badge>Clear Selection <X /></Badge></ToolbarItem>}
          </div>}
          {view !== 'advanced' && (
           <RowBetween style={{ flexDirection: isMobile ? 'column': 'row', gap: isMobile ? 15 : 20, justifyContent: 'center'}}> 
             {!!prices &&  <StyledAutoColumn onClick={updateSettingsForLow} style={{cursor: 'pointer', padding:5, borderRadius:12, border: `1px solid ${gasSettings?.low ? 'lightgreen' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={isMobile ? 24 : 36}>
                  Low
              </TYPE.body>
              <TYPE.body>
                {prices.low}
              </TYPE.body>
            </StyledAutoColumn>}
            {!!prices &&  <StyledAutoColumn onClick={updateSettingsForMed} style={{ cursor: 'pointer', padding:5, borderRadius:12, border: `1px solid ${gasSettings?.medium ? 'lightgreen' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={isMobile ? 24 : 36}>
                  Medium
              </TYPE.body>
              <TYPE.body>
                {prices.medium}
              </TYPE.body>
            </StyledAutoColumn>}
            {!!prices &&  <StyledAutoColumn onClick={updateSettingsForHigh} style={{ padding:5, borderRadius:12,cursor: 'pointer', border: `1px solid ${gasSettings?.high ? 'lightgreen' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={isMobile ? 24 : 36}>
                  High
              </TYPE.body>
              <TYPE.body>
                {prices.high}
                </TYPE.body>
                </StyledAutoColumn>
            }
              {!!prices &&  <StyledAutoColumn onClick={updateSettingsForUltra} style={{ padding:5, borderRadius:12,cursor: 'pointer', border: `1px solid ${gasSettings?.ultra ? 'lightgreen' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={isMobile ? 24 : 36}>
                  Ultra
              </TYPE.body>
              <TYPE.body>
                {prices.ultra}
              </TYPE.body>
            </StyledAutoColumn>}
            </RowBetween>
          )}

          {view === 'advanced' && (
            <>
              <RowFixed style={{display:'block', width: '100%', marginTop: 15, marginBottom:15, columnGap: 15}}>
                  <AutoColumn style={{position:'relative'}} justify="center" gap="md">
                  <label style={{display:'block', width:'100%'}}> Enter a custom GWEI to execute transactions </label>
                  <StyledInput ref={inputRef as any} onChange={onChangeOfGas} value={customGas} style={{width: '100%', height:40, border: '1px solid #ccc', borderRadius:12}} type="number" placeholder="Enter a custom GWEI, i.e. 185" />
                  {showClearCustomGwei && <X color='#222' style={{cursor:'pointer', position:'absolute', right: 30, top: '55%'}} onClick={clearCustomGwei} />}
                  </AutoColumn>
               </RowFixed>
              <TYPE.mediumHeader>Custom GWEI Settings</TYPE.mediumHeader>
              <RowBetween style={{ opacity: !Boolean(gasSettings?.custom) ? 0.5 : 1}}>
                <RowFixed>
                  <TYPE.black fontWeight={400} fontSize={14} color={'text1'}>
                    <>Use Custom GWEI One Time Only</>
                  </TYPE.black>
                  <QuestionHelper text={<>Uses the custom gwei specified on the next executed transaction only.</>} />
                </RowFixed>
                <Toggle
                  disabled={!Boolean(gasSettings?.custom)}
                  id="toggle-disable-multihop-button"
                  isActive={Boolean(gasSettings?.useOnce)}
                  toggle={toggleUseCustomGweiOnce}
                />
                </RowBetween>
              </>
          )}
        </ContentWrapper>
        </Modal>
    )
}

export default GasSelectorModal