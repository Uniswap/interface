import { Token, CurrencyAmount } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core'
import { DarkCard, OutlineCard } from 'components/Card';
import React from 'react'
import { useTokenBalance } from 'state/wallet/hooks';
import { useTrumpBalance } from './VotePage'
import styled from 'styled-components/macro'
import Input from 'components/NumericalInput';
import { useIsDarkMode } from 'state/user/hooks';
import { ButtonPrimary } from 'components/Button';
import { AlertCircle, ChevronLeft } from 'react-feather';
import { BlueCard } from 'components/Card';
import { TYPE } from 'theme';
export type Proposal = {
    proposedBy: string;
    createdAt: string;
    _id: string;
    title: string;
    proposedAmount?: string;
    message: string;
    votes: Array<{wallet: string; vote: boolean}>
}
import axios from 'axios'
import moment from 'moment';
import _ from 'lodash'
import { StyledInternalLink } from 'theme/components';
export const useTrumpGoldBalance = (account?: string | null) => {
    const trumpCoin = new Token(
      1,
      "0x29699C8485302cd2857043FaB8bd885bA08Cf268",
      9,
      "TrumpGold",
      "TGOLD"
    );
  
    const trumpBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
      account ?? undefined,
      trumpCoin
    );
  
    return React.useMemo(() => {
      return trumpBalance;
    }, [trumpBalance, trumpCoin]);
  };
  const Header = styled.div`
  display:flex;
  padding: 15px;
  margin-bottom:15px;
  font-size:24px;
  width: 100%;
`

const Body = styled.div`
display:flex;
margin-bottom:15px;
font-size:14px;
flex-flow:column wrap;
width: 100%;
`

const FormGroup = styled.div`
  padding: 9px 14px;
  margin-bottom:15px;
  width:100%;
  display:flex;
  flex-flow:column wrap;
  justify-content:space-between;
`
export const useProposalData =  () => {
    const [state, setState] = React.useState<Proposal[]>([])

    React.useEffect(() => {
        axios.get<Proposal[]>(`http://localhost:7777/proposal`).then((res) => setState(res.data))
    }, [])

    return {state,setState}
}


export const AddProposal = () => {
    const { account } = useWeb3React()
    const {state: proposals} = useProposalData()

    const lastProposal = React.useMemo(() => {
        console.log('proposals', proposals)
        if (!account || !proposals.length) return false;
        const proposalData = proposals.filter(a => a.proposedBy === account);
        
        if (proposalData && proposalData.length) {
            return moment(new Date()).diff((moment(new Date(proposalData[0].createdAt))), 'days') <= 7;
        } else if (proposalData.length === 0 ) return true
        return false;
    }, [account, proposals])
    
    const trumpGoldBalance = useTrumpGoldBalance(account)
    const [isDisabled, setIsDisabled] = React.useState(false)
    React.useEffect(() => {
    if (account && trumpGoldBalance && +trumpGoldBalance?.toFixed(0) < 200) setIsDisabled(true)
    if (!account) setIsDisabled(true)
    }, [account, trumpGoldBalance])
    
    const [added, setAdded] = React.useState<Proposal>({
        _id: '',
        createdAt: new Date().toLocaleString(),
        message: '',
        proposedBy: account as string,
        title: '',
        proposedAmount: '', 
        votes: []
    })
    const [useMarketingFund, setUseMarketingFund] = React.useState('')
    const isDark = useIsDarkMode()
    
    const onSave = () => {
        axios.put<Proposal>(`http://localhost:7777/proposal`, added).then((response) => {
           window.location.href = `https://exchange.babytrumptoken.com/#/proposal/details/${response.data._id}`
        })
    }
    return (
        <DarkCard style={{maxWidth: 800}}>
            <OutlineCard style={{padding: "9px 14px"}}>

            <StyledInternalLink style={{color: isDark? '#FFF' : '#222'}} to="/vote">
                    <ChevronLeft />
                    Back to proposals
                </StyledInternalLink>
                <Header>Add a proposal for members of the community to vote on</Header>
                <form onSubmit={onSave}>
                <Body>
                    {isDisabled && 
                    (
                        <BlueCard><AlertCircle /> <TYPE.main>You cannot create a proposal without owning atleast 200 TrumpGold tokens.</TYPE.main></BlueCard>
                    )}
                    
                    <FormGroup>
                        <label style={{marginBottom: 10}}>Proposer</label>
                        <input disabled style={{borderRadius: 6, border: `1px solid gold`, color: isDark ? `#fff` : `#222`, background: isDark ? '#333' : '#fff', padding: '5px'}} type="text"  value={account ?? ''} />
                    </FormGroup>

                    <FormGroup>
                        <label style={{marginBottom : 10}}>Create a title for your proposal</label>
                        <input disabled={isDisabled} required onChange={e => setAdded({...added, title: e.target.value})} style={{borderRadius: 6, border: `1px solid gold`, color: isDark ? `#fff` : `#222`, background: isDark ? '#333' : '#fff', padding: '5px'}} type="text"  value={added.title ?? ''} />
                    </FormGroup>

                    <FormGroup>
                        <label style={{marginBottom: 10}}>Explain your proposal</label>
                        <textarea disabled={isDisabled} required style={{borderRadius: 6, border: `1px solid gold`, color: isDark ? `#fff` : `#222`, background: isDark ? '#333' : '#fff', padding: '5px'}} onChange={e => setAdded({...added, message: e.target.value})} rows={9} placeholder={"Explain to the community why this proposal is important and they should vote yes on your idea."} />
                    </FormGroup>

                    <FormGroup>
                        <label style={{marginBottom: 10}}>Does your proposal include usage of marketing funds?</label>
                        <select  style={{borderRadius: 6, border: `1px solid gold`, color: isDark ? `#fff` : `#222`, background: isDark ? '#333' : '#fff', padding: '5px'}} disabled={isDisabled} value={useMarketingFund} onChange={e => setUseMarketingFund(e.target.value)}>
                            <option value={''}>Please select</option>
                            <option value={'yes'}>Yes</option>
                            <option value={'no'}>No</option>
                        </select>
                    </FormGroup>

                    {useMarketingFund === 'yes' && (
                        <FormGroup>
                            <label>How much ETH do you propose is used?</label>
                            <input disabled={isDisabled} required placeholder={"Enter the amount of funds you are proposing be used (IN ETH)"} onChange={e => setAdded({...added, proposedAmount: e.target.value })} style={{borderRadius: 6, border: `1px solid gold`, color: isDark ? `#fff` : `#222`, background: isDark ? '#333' : '#fff', padding: '5px'}} type="number"  value={added?.proposedAmount ? added.proposedAmount :  ''} />
                        </FormGroup>
                    )}
                    <FormGroup>
                        {lastProposal && <small style={{color:'#ff7676', textAlign: 'center', paddingLeft:15, marginBottom: 15}}>You cannot submit more than one proposal within a week.</small>}
                        <ButtonPrimary type="submit" disabled={isDisabled || lastProposal}>Add Proposal</ButtonPrimary>
                    </FormGroup>
                </Body>
                </form>

            </OutlineCard>
        </DarkCard>
    )
        
}