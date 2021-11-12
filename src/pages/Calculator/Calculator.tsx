import { useWeb3React } from '@web3-react/core';
import Badge from 'components/Badge';
import { GreyCard } from 'components/Card';
import { CardSection } from 'components/earn/styled';
import { useUSDCValue } from 'hooks/useUSDCPrice';
import React from 'react';
import { Plus } from 'react-feather';
import { TYPE } from 'theme';
import { useKiba } from '../Vote/VotePage';

export const Calculator = () => {
    const { account } = useWeb3React();
    const [marketCap, setMarketCap] = React.useState('')
    const balance = useKiba(account)
    const renderConnectMessage = () => (
        <React.Fragment>
            <Badge>Connect your wallet to use the gains calculator</Badge>
        </React.Fragment>
    )

    return (
        <GreyCard style={{maxWidth: 600}}>
            <CardSection>
                <h3>GAINSCALCULATOR&trade;</h3>
            </CardSection>
            <CardSection>
                <Plus />
                <div>
                    <TYPE.main>Select a market cap to see what your current Kiba would be worth</TYPE.main>
                    <select onChange={e => setMarketCap(e.target.value)}>
                        <option>Select a market cap</option>
                        <option value="30">30 Million</option>
                        <option value="300">300 Million</option>
                        <option value="3B">3 Billion</option>
                    </select>
                </div>

                <div>
                    
                    {balance && <Badge>{balance.toFixed(2)}</Badge>}
                </div>
            </CardSection>
        </GreyCard>
    )
}