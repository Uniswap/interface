import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled from 'styled-components'

import { useWeb3React, useContract, useExchangeContract } from '../../hooks'
import { useAllTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder, usePendingMigrate, useDoneMigrate } from '../../contexts/Transactions'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useAddressBalance } from '../../contexts/Balances'

import { calculateGasMargin, amountFormatter } from '../../utils'

import Card from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import Badge from '../Badge'
import Button from '../Button'
import CloseIcon from '../CloseIcon'
import Loader from '../Loader'
import Icon from '../Icon'
import { Link } from '../Link'
import { TextBlock } from '../Text'

import Lock from '../../assets/images/lock.png'
import MIGRATOR_ABI from '../../constants/abis/migrator'
import { MIGRATOR_ADDRESS } from '../../constants'

const Wrapper = styled.div``

const BodyText = styled(TextBlock)`
  font-size: 20px;
`

const Grouping = styled.div`
  display: grid;
  grid-template-columns: auto auto auto 1fr;
  justify-items: start;
  column-gap: 1rem;
  align-items: center;
  height: 40px;
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

const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

function Migrate({ token, done = false }) {
  const [open, toggleOpen] = useState(false)

  const { account } = useWeb3React()
  const allTokenDetails = useAllTokenDetails()
  const addTransaction = useTransactionAdder()

  const symbol = allTokenDetails[token].symbol
  const exchangeAddressV1 = allTokenDetails[token].exchangeAddress
  const exchangeAddressV2 = allTokenDetails[token].exchangeAddressV2

  const exchangeContractV1 = useExchangeContract(exchangeAddressV1)
  const migratorContract = useContract(MIGRATOR_ADDRESS, MIGRATOR_ABI)

  const poolTokenBalanceV1 = useAddressBalance(account, exchangeAddressV1)
  const poolTokenBalanceV2 = useAddressBalance(account, exchangeAddressV2)
  const tokenAllowance = useAddressAllowance(account, exchangeAddressV2, MIGRATOR_ADDRESS)

  const [pendingApproval, setPendingApproval] = useState(false)
  const pendingMigration = usePendingMigrate(token)
  const [confirmingMigration, setConfirmingMigration] = useState(false)

  const approvalDone =
    tokenAllowance && token && poolTokenBalanceV1 && tokenAllowance.gte(poolTokenBalanceV1.toString())
  const migrationDone = useDoneMigrate(token)

  const migrated = done || migrationDone

  useEffect(() => {
    if (approvalDone) {
      setPendingApproval(false)
    }
  }, [approvalDone])

  const tryApproval = () => {
    setPendingApproval(true)
    exchangeContractV1 &&
      token &&
      poolTokenBalanceV1 &&
      exchangeContractV1
        .approve(MIGRATOR_ADDRESS, poolTokenBalanceV1)
        .then(response => {
          addTransaction(response, { approval: token })
        })
        .catch(() => {
          setPendingApproval(false)
        })
  }

  // % above the calculated gas cost that we actually send, denominated in bips
  const GAS_MARGIN = ethers.utils.bigNumberify(1000)

  const tryMigration = async () => {
    setConfirmingMigration(true)
    const now = Math.ceil(Date.now() / 1000)
    const estimatedGasLimit = await migratorContract.estimate.migrate(
      token,
      0,
      0,
      account,
      now + DEFAULT_DEADLINE_FROM_NOW
    )
    migratorContract
      .migrate(token, 0, 0, account, now + DEFAULT_DEADLINE_FROM_NOW, {
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      })
      .then(response => {
        setConfirmingMigration(false)
        addTransaction(response, { migrate: token })
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }

  return (
    <div>
      <Wrapper>
        <Card outlined={open} style={migrated && !open ? { opacity: '0.9' } : {}}>
          <Grouping>
            {migrated ? (
              <DoubleLogo
                size="24px"
                addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
                addressOne={token}
              />
            ) : (
              <TokenLogo size="24px" address={token} />
            )}
            {migrated ? (
              <BodyText>
                {amountFormatter(poolTokenBalanceV1, 18, 6) < 0.00001
                  ? '<0.00001 ' + allTokenDetails[token].symbol
                  : amountFormatter(poolTokenBalanceV1, 18, 5) + ' ' + allTokenDetails[token].symbol}
                <InlineSubText>/ETH</InlineSubText> Pool Tokens
              </BodyText>
            ) : (
              <BodyText>
                {amountFormatter(poolTokenBalanceV1, 18, 5) < 0.00001
                  ? '<0.00001 ' + allTokenDetails[token].symbol
                  : amountFormatter(poolTokenBalanceV1, 18, 6) + ' ' + allTokenDetails[token].symbol}{' '}
                Pool Tokens
              </BodyText>
            )}
            {migrated ? <Badge variant="green">V2</Badge> : <Badge variant="yellow">V1</Badge>}
            {!open ? (
              migrated ? (
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
            ) : (
              <CloseIcon
                onClick={() => {
                  toggleOpen(false)
                }}
              />
            )}
          </Grouping>
        </Card>
        {open && (
          <BottomWrapper>
            <FormattedCard outlined={!approvalDone && 'outlined'}>
              <Row>
                <BodyText>Step 1</BodyText>
                {approvalDone ? <GreenText>✓</GreenText> : pendingApproval ? <Loader /> : ''}
              </Row>
              <Button
                variant={approvalDone && 'success'}
                py={18}
                onClick={() => {
                  !approvalDone && tryApproval()
                }}
              >
                {approvalDone ? 'Confirmed' : pendingApproval ? 'Waiting For Confirmation...' : 'Approve for upgrade'}
              </Button>
              <SubText>The upgrade helper needs your permssion to upgrade on your behalf</SubText>
            </FormattedCard>
            <FormattedCard outlined={approvalDone && 'outlined'}>
              <Row>
                <BodyText>Step 2</BodyText>
                {pendingMigration || confirmingMigration ? (
                  <Loader />
                ) : migrationDone ? (
                  <GreenText>✓</GreenText>
                ) : approvalDone ? (
                  ''
                ) : (
                  <Icon icon={Lock} />
                )}
              </Row>
              <Button
                variant={migrationDone && 'success'}
                disabled={!approvalDone}
                py={18}
                onClick={() => {
                  !migrationDone && tryMigration()
                }}
              >
                {pendingMigration || confirmingMigration
                  ? 'Waiting For Confirmation...'
                  : migrationDone
                  ? 'Confirmed'
                  : 'Migrate Liquidity'}
              </Button>
              <SubText>
                Your {symbol} Liquidity will appear as {symbol}/ETH wth a new icon. <Link>Read more.</Link>
              </SubText>
            </FormattedCard>
          </BottomWrapper>
        )}
      </Wrapper>
      {poolTokenBalanceV2 && (
        <Card style={{ opacity: '0.7', marginTop: '1rem' }}>
          <Grouping>
            <DoubleLogo
              size="24px"
              addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
              addressOne={token}
            />
            <BodyText>
              {amountFormatter(poolTokenBalanceV2, 18, 6) < 0.00001
                ? '<0.00001 ' + allTokenDetails[token].symbol
                : amountFormatter(poolTokenBalanceV2, 18, 5) + ' ' + allTokenDetails[token].symbol}
              <InlineSubText>/ETH</InlineSubText> Pool Tokens
            </BodyText>
            <Badge variant="green">V2</Badge>
            <Icon variant="filled" fillColor="green2">
              ✓
            </Icon>
          </Grouping>
        </Card>
      )}
    </div>
  )
}

export default withRouter(Migrate)
