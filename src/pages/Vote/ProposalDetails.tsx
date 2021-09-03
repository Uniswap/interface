import { ButtonPrimary } from 'components/Button'
import { DarkCard, OutlineCard } from 'components/Card'
import React from 'react'
import { ChevronLeft, ExternalLink, ThumbsDown, ThumbsUp } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { Proposal } from './AddProposal'
import axios from 'axios'
import { IconWrapper } from 'theme/components'
import { useWeb3React } from '@web3-react/core'
import { useStimulusBalance } from './VotePage'
import { useTrumpGoldBalance } from './AddProposal'
import { useTrumpBalance } from './VotePage'
import moment from 'moment'
import { BlueCard } from 'components/Card'
import { StyledInternalLink } from 'theme/components'
import { useIsDarkMode } from 'state/user/hooks'
export const ProposalDetails = () => {
    const params = useParams<{id: string}>()
    const [data, setData] = React.useState<Proposal>()

    React.useEffect(() => {
        console.log(params)
        if (params && params['id']) {
          axios.get('https://api.babytrumptoken.com/proposal/' + params['id']).then((response) => setData(response.data))
        }
    }, [params])
    const Header = styled.div`
        display:flex;
        padding: 15px;
        margin-bottom:15px;
        font-size:24px;
        width: 100%;
    `

    const Body = styled.div`
    display:flex;
    padding: 15px;
    margin-bottom:15px;
    font-size:12px;
    flex-flow: column wrap;
    width: 100%;
    `

    const { account } = useWeb3React()
    const trumpBalance = useTrumpBalance(account)
    const trumpGoldBalacne = useTrumpGoldBalance(account)
    const stimulusBalnace =useStimulusBalance(account)
    const updateVoteIfApplicable = ( vote: boolean ) => {
        if (!data) return;
        if (!account) {
            alert("Please connect a wallet first to vote.");
            return;
        }
       if ([trumpBalance, trumpGoldBalacne, stimulusBalnace].every(a => !!a && +a?.toFixed(0) <= 0)) {
           alert("Cannot vote unless you own Stimulus Check, Trump Gold, or Baby Trump tokens.");
           return;
       }
       if (data?.votes?.some((vote:any) => vote.wallet === account)) {
           alert("Cannot vote more than once!");
           return;
       }
       if (account === data?.proposedBy) {
           alert("Cannot vote on your own proposal!");
           return;
       }
       axios.post("https://api.babytrumptoken.com/proposal/" + data._id, {...data, votes: [...data.votes, { wallet: account, vote: vote }]}).then((response) => setData(response.data))
    }

    const isDark =useIsDarkMode()
    const proposalExpired = React.useMemo(() => {
        if (!data) return true;

        return moment(new Date()).diff(moment(data?.createdAt), 'days') >= 7;
    }, [data])

    const accountVotedYes = React.useMemo(() => {
        if (!data || !account) return false

        return data.votes.some((a:any) => a.wallet === account && a.vote === true)
    }, [account, data])


    const accountVotedNo = React.useMemo(() => {
        if (!data || !account) return false

        return data.votes.some((a:any) => a.wallet === account && a.vote === true)
    }, [account, data])
    return (
        <DarkCard style={{maxWidth:900}}>
            <OutlineCard style={{padding: '9px 14px'}}>
                 <StyledInternalLink style={{color: isDark? '#FFF' : '#222'}} to="/vote">
                    <ChevronLeft />
                    Back to proposals
                </StyledInternalLink>
                {data && (
                <>
                <Header style={{alignItems:'center'}}>{data.title} &nbsp;
               <small><a style={{fontSize:12}}  href={`https://etherscan.io/address/${data.proposedBy}`}>(proposed by <i>{data.proposedBy}</i> )</a></small> </Header>
                <Body>
                    {proposalExpired && <BlueCard><TYPE.main>The proposal expired. Proposals only last for 7 days, which after they are closed and the votes are final.</TYPE.main></BlueCard>}
                    <div style={{display:'block', marginBottom: 15, width: '100%;' }}>
                        <label style={{width: '100%', marginBottom: 15}}>Proposed terms:</label>
                        <p style={{padding:15, border: '1px solid #ccc'}}><TYPE.main>{data.message}</TYPE.main></p>
                    </div>
                   {data.proposedAmount && (
                    <div style={{display:'block', marginBottom: 15, width: '100%;' }}>
                            <label style={{width: '100%', marginBottom: 15}}>Proposed Amount of ETH to Spend:</label>
                            <p style={{padding:15, border: '1px solid #ccc'}}><TYPE.main>{data.proposedAmount} (ETH)</TYPE.main></p>
                        </div>
                   )}

                    <div>
                        <label style={{marginBottom:20}}>Community votes:</label>
                    </div>
                    <div>
                    {!data?.votes?.some((vote:any) => vote.wallet === account) && <TYPE.main><small>Click an icon to express your vote</small></TYPE.main>}
                    </div>


                    <div style={{pointerEvents: proposalExpired ? 'none' : 'all', display:'flex', alignItems:'center', flexFlow: 'row wrap'}}>
                       <IconWrapper onClick={() => updateVoteIfApplicable(true)}  style={{cursor:'pointer',margin:1, width: 50, height: 50}}><ThumbsUp style={{color: accountVotedYes ? 'green' : 'inherit'}} size={'30px'} /> {data?.votes?.filter((a: {wallet: string; vote:boolean})=> !!a.vote).length}</IconWrapper>
                       <IconWrapper onClick={() => updateVoteIfApplicable(false)} style={{cursor:'pointer', width: 50, height: 50,  }}><ThumbsDown style={{color: accountVotedNo ? 'red' : 'inherit'}} size={'30px'}></ThumbsDown> {data?.votes?.filter((a: {wallet: string; vote:boolean})=> !a.vote).length}</IconWrapper>
                    </div>

                    {proposalExpired && <div style={{display:'block', width:'100%'}}>
                        {data?.votes?.filter((a: {wallet: string; vote:boolean})=> !a.vote).length > 
                        data?.votes?.filter((a: {wallet: string; vote:boolean})=> !!a.vote).length ? 'Proposal Accepted' : 'Proposal Denied'}
                    </div>}
                </Body>
                </>
                )}
                {!data && (
                    <TYPE.main>Loading proposal data...</TYPE.main>
                )}
            </OutlineCard>
        </DarkCard>
    )
}