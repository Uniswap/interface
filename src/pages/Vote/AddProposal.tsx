import { Token, CurrencyAmount } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core'
import { DarkCard, OutlineCard } from 'components/Card';
import React from 'react'
import { useTokenBalance } from 'state/wallet/hooks';
import { useKiba } from './VotePage'
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
import CreateProposal from 'pages/CreateProposal';
export const useTrumpGoldBalance = (account?: string | null) => {
    const trumpCoin = new Token(
      1,
      "0x29699C8485302cd2857043FaB8bd885bA08Cf268",
      9,
      "TrumpGold",
      "TGOLD"
    );
  
    const kibaBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
      account ?? undefined,
      trumpCoin
    );
  
    return React.useMemo(() => {
      return kibaBalance;
    }, [kibaBalance, trumpCoin]);
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
        axios.get<Proposal[]>(`https://api.babytrumptoken.com/proposal`).then((res) => setState(res.data))
    }, [])

    return {state,setState}
}


export const AddProposal = () => <CreateProposal />