import { useWeb3React } from '@web3-react/core'
import { BlueCard } from 'components/Card'
import Header from 'components/Header'
import { StackedContainer } from 'pages/AddLiquidity/styled'
import { ResponsiveHeaderText, Wrapper } from 'pages/RemoveLiquidity/styled'
import { useTrumpBalance } from 'pages/Vote/VotePage'
import React from 'react'
import { Check, DollarSign, List } from 'react-feather'
import { Card } from 'rebass'
import { TYPE } from 'theme'
import { StyledInternalLink } from 'theme/components'

export const Suite = () => {
  const { account } = useWeb3React()
  const trumpBalance = useTrumpBalance(account)
  const isHolder = React.useMemo(() => {
    return trumpBalance && +trumpBalance?.toFixed(2) > 0
  }, [account, trumpBalance])

  const routes = [
    {
      route: '/rug-checker',
      label: 'Rug Checker',
      description:
        'The BabyTrump Rug Checker is designed to help all ranges of investors run checks on Smart Contracts that will process the contract and determine key details like if their liquidity is locked and ownership is renounced',
        icon: Check
    },
    {
        route: '/gains',
        label: "Gains Tracker",
        description: 'Track gains from ANY redistribution token on the Ethereum blockchain',
        icon: DollarSign
    }
  ]

  return (
    <Card>
      <ResponsiveHeaderText style={{ display: 'flex' }}>
        <h5>
          TrumpTools&trade;
        </h5>
      </ResponsiveHeaderText>
      <BlueCard style={{ maxWidth: 600 }}>
      <List />
        <StackedContainer>
            {routes.map((route) => (
                <Wrapper key={route.route} style={{padding: 20,display: 'grid', gridTemplateColumns: '10% 90%', alignItems: 'center'}}>
                    <div>
                     <route.icon />
                    </div>
                    <div>
                    <h3><TYPE.main>{route.label} </TYPE.main></h3>
                    <small style={{marginBottom: 25, display: 'flex'}}><TYPE.blue>{route.description}</TYPE.blue></small>
                    <StyledInternalLink to={route.route}>{route.label}</StyledInternalLink>
                    </div>
                </Wrapper>

            ))}
        </StackedContainer>
      </BlueCard>
    </Card>
  )
}
