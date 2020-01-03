import React, { useState } from 'react'
import { withRouter } from 'react-router'
import styled from 'styled-components'
// import Card from '../Card'
import Card, { CardOutlined } from '../CardStyled'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import Badge from '../Badge'
import Button from '../Button'
import CloseIcon from '../CloseIcon'
import Loader from '../Loader'
import Icon from '../Icon'
import { Link } from '../Link'
import { useAllTokenDetails } from '../../contexts/Tokens'

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
  color: ${({ theme }) => theme.colors.grey5};
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
  align-items: center;
`

const GreenText = styled.span`
  color: ${({ theme }) => theme.colors.green2};
  font-size: 24px;
`

const InlineSubText = styled.span`
  font-size: 12px;
`

function Migrate({ userPool }) {
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
    }, 600)
  }

  const tryMigration = () => {
    setGettingMigration(true)
    setTimeout(() => {
      setMigrateDone(true)
      setGettingMigration(false)
    }, 600)
  }

  function VariableCard({ children }) {
    return open ? (
      <CardOutlined style={complete && !open ? { opacity: '0.5' } : {}}>{children}</CardOutlined>
    ) : (
      <Card style={complete && !open ? { opacity: '0.5' } : {}}>{children}</Card>
    )
  }

  return (
    <Wrapper>
      <VariableCard>
        <Grouping>
          {complete ? (
            <DoubleLogo
              size={'24px'}
              addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
              addressOne={userPool.token}
            />
          ) : (
            <TokenLogo size="24px" address={userPool.token} />
          )}
          {complete ? (
            <BodyText>
              {userPool.balance.lt(0.00001)
                ? '<0.00001'
                : userPool.balance.toFixed(5).toString() + ' ' + allTokenDetails[userPool.token].symbol}
              <InlineSubText>/ETH</InlineSubText> Pool Tokens
            </BodyText>
          ) : (
            <BodyText>
              {userPool.balance.lt(0.00001)
                ? '<0.00001 ' + allTokenDetails[userPool.token].symbol
                : userPool.balance.toFixed(5).toString() + ' ' + allTokenDetails[userPool.token].symbol}{' '}
              Pool Tokens
            </BodyText>
          )}
          {complete ? <Badge variant="green">V2</Badge> : <Badge variant="yellow">V1</Badge>}
          {!open ? (
            complete ? (
              <Icon variant="filled" fillColor="green2">
                ✓
              </Icon>
            ) : (
              <Button
                onClick={() => {
                  toggleOpen(true)
                }}
              >
                Upgrade
              </Button>
            )
          ) : complete ? (
            <Button
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
      </VariableCard>
      {open && (
        <BottomWrapper>
          <FormattedCard outlined={!approveDone && 'outlined'}>
            <Row>
              <BodyText>Step 1</BodyText>
              {gettingApproval ? <Loader /> : approveDone ? <GreenText>✓</GreenText> : ''}
            </Row>
            <Button
              variant={approveDone && 'success'}
              py={18}
              onClick={() => {
                !approveDone && tryApproval()
              }}
            >
              {gettingApproval ? 'Waiting For Confirmation...' : approveDone ? 'Confirmed' : 'Approve for upgrade'}
            </Button>
            <SubText>The upgrade helper needs your permssion to upgrade on your behalf</SubText>
          </FormattedCard>
          <FormattedCard outlined={approveDone && 'outlined'}>
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
              variant={migrateDone && 'success'}
              disabled={!approveDone}
              py={18}
              onClick={() => {
                !migrateDone && tryMigration()
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
