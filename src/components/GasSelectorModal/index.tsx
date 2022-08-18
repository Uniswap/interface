import { CloseIcon, TYPE } from "theme";
import { RowBetween, RowFixed } from "components/Row";
import { useSetUserGasPreference, useUserGasPreference } from "state/user/hooks";

import { AutoColumn } from "components/Column";
import Badge from "components/Badge";
import { ButtonError } from "components/Button";
import { CheckCircle } from "react-feather";
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

    const customGas = gasSettings?.custom && gasSettings?.custom > 0 ? gasSettings?.custom : undefined
    React.useEffect(() => {
        getCurrentGasPrices().then(setPrices)
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
    return (
        <Modal maxHeight={600} isOpen={isOpen} onDismiss={onDismiss}>
             <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>
              <>Gas Settings</><br/>
              <small>Select your preferred gas settings below</small>
            </TYPE.mediumHeader>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <RowFixed style={{columnGap: 15}}>
              <Badge style={{cursor: 'pointer'}} onClick={updateToBasicView}>Basic {view === 'basic' && <CheckCircle /> }</Badge>
              <Badge style={{cursor: 'pointer'}} onClick={updateToAdvancedView}>Advanced {view === 'advanced' && <CheckCircle /> }</Badge>
          </RowFixed>
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
              <RowFixed style={{columnGap: 15}}>
                  <label style={{display:'block'}}> Custom Gas W</label>
                  <input onChange={onChangeOfGas} value={customGas} style={{height:40, border: '1px solid #ccc', borderRadius:12}} type="number" placeholder="Enter custom gas" />
            </RowFixed>
          )}
        </ContentWrapper>
        </Modal>
    )
}

export default GasSelectorModal