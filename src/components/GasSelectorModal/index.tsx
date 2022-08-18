import { CheckCircle, RefreshCw, X } from "react-feather";
import { CloseIcon, TYPE } from "theme";
import { RowBetween, RowFixed } from "components/Row";
import { useSetUserGasPreference, useUserGasPreference } from "state/user/hooks";

import { AutoColumn } from "components/Column";
import Badge from "components/Badge";
import { ButtonError } from "components/Button";
import Modal from "components/Modal";
import React from 'react'
import { Trans } from "@lingui/react";
import axios from "axios";
import { error } from "console";
import styled from "styled-components/macro";

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  overflow:hidden;
`

type GasSelectorProps = {
    isOpen: boolean;
    onDismiss: () => void;

}

const StyledAutoColumn = styled(AutoColumn)`
:hover {
    border: 1px solid green;
}
`

const ToolbarItem = styled(AutoColumn)`
 cursor: pointer;
 padding:9px;
 background:#222;
 transition: ease all 0.2s;
 &:hover{
     > * { 
         background:#ccc; color: #222;  transition: ease all 0.2s;
     }
 }
`;

export const GasSelectorModal = (props: GasSelectorProps) => {
    const {isOpen, onDismiss} = props;

    async function getCurrentGasPrices() {
        const fetchEndpoint = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=2SIRTH18CHU6HM22AGRF1XE9M7AKDR9PM7`
        const response = await axios.get(fetchEndpoint);
        const prices = {
          low: response.data.result.SafeGasPrice,
          medium: response.data.result.ProposeGasPrice,
          // add 5 to the recommended gas produced by etherscan..
          high: (parseInt(response.data.result.FastGasPrice) + 5)
        };
        return prices;
    }

    const [prices, setPrices] = React.useState<any>()
    
    const gasSettings = useUserGasPreference()
    const setUserGasSettings = useSetUserGasPreference()
    const [view, setView] = React.useState<'advanced' | 'basic'>(gasSettings?.custom && gasSettings?.custom > 0 ? 'advanced' : 'basic')

    const fetchGasPrices = ( ) => getCurrentGasPrices().then(setPrices)
    
    const customGas = gasSettings?.custom && gasSettings?.custom > 0 ? gasSettings?.custom : undefined
    React.useEffect(() => {
        fetchGasPrices()
    }, [isOpen])

    const updateToBasicView = () => setView('basic')
    const updateToAdvancedView = () => setView('advanced')

    const updateSettingsForLow = () => {
        setUserGasSettings({...gasSettings, low: true, medium: false, high: false })
    }

    const updateSettingsForMed = () => {
        setUserGasSettings({...gasSettings, low: false, medium: true, high: false })
    }

    const updateSettingsForHigh = () => {
        setUserGasSettings({...gasSettings, low: false, medium: false, high: true })
    }

    const onChangeOfGas = (e: any) => {
        setUserGasSettings({...gasSettings, custom: e.target.value });
    }

    const resetToDefaults = () => {
        setUserGasSettings({low:false,medium:false,high:false, custom: undefined})
    }

    const refreshGasPrices = () => {
        fetchGasPrices()
    }
    return (
        <Modal size={500} maxHeight={600}  isOpen={isOpen} onDismiss={onDismiss}>
             <ContentWrapper gap="sm">
          <RowBetween>
            <TYPE.mediumHeader>
              <>Gas Settings</><br/>
              <small>Select your preferred gas settings below</small>
            </TYPE.mediumHeader>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <RowFixed style={{marginBottom:15, columnGap: 15}}>
              <Badge style={{cursor: 'pointer'}} onClick={updateToBasicView}>Basic {view === 'basic' && <CheckCircle /> }</Badge>
              <Badge style={{cursor: 'pointer'}} onClick={updateToAdvancedView}>Advanced {view === 'advanced' && <CheckCircle /> }</Badge>
          </RowFixed>
          {view === 'basic' && <div style={{display:'flex', justifyContent:'center', alignItems: 'center', columnGap:10}}>
              <ToolbarItem onClick={refreshGasPrices}><Badge>Refresh Gas &nbsp;<RefreshCw /></Badge></ToolbarItem>
              { Boolean(gasSettings?.high || gasSettings?.low || gasSettings?.medium) && <ToolbarItem onClick={resetToDefaults}><Badge>Clear Selection <X /></Badge></ToolbarItem>}
          </div>}
          {view !== 'advanced' && (
           <RowBetween style={{ columnGap: 30, justifyContent: 'center'}}> 
             {!!prices &&  <StyledAutoColumn onClick={updateSettingsForLow} style={{cursor: 'pointer', padding:5, borderRadius:12, border: `1px solid ${gasSettings?.low ? '#fff' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                  Low
              </TYPE.body>
              <TYPE.body>
                {prices.low}
              </TYPE.body>
            </StyledAutoColumn>}
            {!!prices &&  <StyledAutoColumn onClick={updateSettingsForMed} style={{ cursor: 'pointer', padding:5, borderRadius:12, border: `1px solid ${gasSettings?.medium ? '#fff' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                  Medium
              </TYPE.body>
              <TYPE.body>
                {prices.medium}
              </TYPE.body>
            </StyledAutoColumn>}
            {!!prices &&  <StyledAutoColumn onClick={updateSettingsForHigh} style={{ padding:5, borderRadius:12,cursor: 'pointer', border: `1px solid ${gasSettings?.high ? '#fff' : 'transparent'}`}} justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                  High
              </TYPE.body>
              <TYPE.body>
                {prices.high}
              </TYPE.body>
            </StyledAutoColumn>}
            </RowBetween>
          )}

          {view === 'advanced' && (
              <RowFixed style={{marginTop: 15, columnGap: 15}}>
                  <AutoColumn justify="center" gap="md">
                  <label style={{display:'block', width:'100%'}}> Custom Gas </label>
                  <input onChange={onChangeOfGas} value={customGas} style={{width: '100%', height:40, border: '1px solid #ccc', borderRadius:12}} type="number" placeholder="Custom GWEI" />
                  </AutoColumn>
            </RowFixed>
          )}
        </ContentWrapper>
        </Modal>
    )
}

export default GasSelectorModal