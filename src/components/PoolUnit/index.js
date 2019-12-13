import React, { useState } from 'react'
import { withRouter } from 'react-router'
import styled from 'styled-components'
import Card from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import Badge from '../Badge'
import Button from '../Button'
import CloseIcon from '../CloseIcon'
import Loader from '../Loader'
import Icon from '../Icon'
import { Link } from '../Link'
import { useAllTokenDetails } from '../../contexts/Tokens'
import { useWeb3React } from '../../hooks'

import Lock from '../../assets/images/lock.png'

const Wrapper = styled.div``

const BodyText = styled.span`
  font-size: 20px;
  word-wrap: no-wrap;
`

const Grouping = styled.div`
  display: grid;
  grid-template-columns: auto auto auto 1fr;
  justify-items: start;
  column-gap: 1rem;
  height: 40px;
  align-items: center;
  width: 100%;
  *:last-child {
    justify-self: end;
  }
`

const BottomWrapper = styled.div`
  display: grid;
  width: 100%;
  padding: 10px 0;
  grid-column-gap: 10px;
  grid-template-columns: auto auto;
  & > div {
    height: fit-content;
  }
`

const SubText = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.disabledText};
`

const FormattedCard = styled(Card)`
  display: grid;
  row-gap: 20px;
  padding: 2rem 1rem;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 32px;
  justify-content: space-between;
`

const GreenText = styled.span`
  color: ${({ theme }) => theme.connectedGreen};
  font-size: 24px;
`

const InlineSubText = styled.span`
  font-size: 12px;
`

function Migrate({ userPool }) {
  const { account } = useWeb3React()

  const [open, toggleOpen] = useState(false)

  const [approveDone, setApproveDone] = useState(false)

  const [migrateDone, setMigrateDone] = useState(false)

  const [gettingApproval, setGettingApproval] = useState(false)

  const [gettingMigration, setGettingMigration] = useState(false)

  const allTokenDetails = useAllTokenDetails()

  const complete = approveDone && migrateDone

  const tryApproval = () => {
    setGettingApproval(true)
    setTimeout(() => {
      setApproveDone(true)
      setGettingApproval(false)
    }, 4000)
  }

  const tryMigration = () => {
    setGettingMigration(true)
    setTimeout(() => {
      setMigrateDone(true)
      setGettingMigration(false)
    }, 4000)
  }

  return (
    <Wrapper>
      <Card variant={open ? 'outlined' : 'default'} style={complete && !open ? { opacity: '0.5' } : {}}>
        <Grouping>
          {complete ? (
            <DoubleLogo
              size={'24px'}
              addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'}
              addressOne={'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'}
            />
          ) : (
            <TokenLogo size="24px" address={userPool.token} />
          )}
          {complete ? (
            <BodyText>
              {userPool.balance.toString() + ' ' + allTokenDetails[userPool.token].symbol}
              <InlineSubText>/ETH</InlineSubText> Pool Tokens
            </BodyText>
          ) : (
            <BodyText>
              {userPool.balance.toString() + ' ' + allTokenDetails[userPool.token].symbol} Pool Tokens
            </BodyText>
          )}
          {complete ? <Badge color={'#27AE60'}>V2</Badge> : <Badge color={'#F3BE1E'}>V1</Badge>}
          {!open ? (
            complete ? (
              <Icon variant="filled" fillColor="green" size="32px">
                ✓
              </Icon>
            ) : (
              <Button
                onClick={() => {
                  toggleOpen(true)
                }}
                size="small"
              >
                Upgrade
              </Button>
            )
          ) : complete ? (
            <Button
              size="small"
              onClick={() => {
                toggleOpen(false)
              }}
            >
              Done
            </Button>
          ) : (
            <CloseIcon
              onClick={() => {
                toggleOpen(false)
              }}
            />
          )}
        </Grouping>
      </Card>
      {!open ? (
        ''
      ) : (
        <BottomWrapper>
          <FormattedCard variant={!approveDone ? 'outlined' : 'default'}>
            <Row>
              <BodyText>Step 1</BodyText>
              {gettingApproval ? <Loader /> : approveDone ? <GreenText>✓</GreenText> : ''}
            </Row>
            <Button
              width="full"
              size="large"
              success={approveDone}
              onClick={() => {
                tryApproval()
              }}
            >
              {gettingApproval ? 'Waiting For Confirmation...' : approveDone ? 'Confirmed' : 'Approve for upgrade'}
            </Button>
            <SubText>The upgrade helper needs your permssion to upgrade on your behalf</SubText>
          </FormattedCard>
          <FormattedCard variant={approveDone ? 'outlined' : 'default'}>
            <Row>
              <BodyText>Step 2</BodyText>
              {gettingMigration ? (
                <Loader />
              ) : migrateDone ? (
                <GreenText>✓</GreenText>
              ) : approveDone ? (
                ''
              ) : (
                <Icon icon={Lock} />
              )}
            </Row>
            <Button
              width="full"
              size="large"
              disabled={!approveDone}
              success={migrateDone}
              onClick={() => {
                tryMigration()
              }}
            >
              {gettingMigration ? 'Waiting For Confirmation...' : migrateDone ? 'Confirmed' : 'Migrate Liquidity'}
            </Button>
            <SubText>
              Your {allTokenDetails[userPool.token].symbol} Liquidity will appear as{' '}
              {allTokenDetails[userPool.token].symbol}/ETH wth a new icon. <Link>Read more.</Link>
            </SubText>
          </FormattedCard>
        </BottomWrapper>
      )}
    </Wrapper>
  )
}

export default withRouter(Migrate)
