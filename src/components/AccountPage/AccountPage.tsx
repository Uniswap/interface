import { useWeb3React } from '@web3-react/core';
import Badge, { BadgeVariant } from 'components/Badge';
import { DarkCard } from 'components/Card';
import { Wrapper } from 'pages/Pool/styleds';
import React from 'react';
import styled from 'styled-components/macro';

const StyledHeader = styled.div`
font-size:24px;
font: "Bangers", cursive; `

export const AccountPage = ( ) => {
    const { account } = useWeb3React()
    const [transactions, setTransactions] = React.useState<any[]>([])

    if (!account) return null;

    console.log(transactions)
    return (
        <DarkCard style={{maxWidth:700,background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))'}}>
                            <StyledHeader>Account Details</StyledHeader>
                            <Badge variant={BadgeVariant.POSITIVE}>{account}</Badge>
            <Wrapper>
            </Wrapper>
        </DarkCard>
    )
}