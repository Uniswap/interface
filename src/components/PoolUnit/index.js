import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'
import { animated, useTransition } from 'react-spring'

import { useWeb3React, useContract, useExchangeContract, usePrevious } from '../../hooks'
import { useAllTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder, useDoneMigrate } from '../../contexts/Transactions'
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
import TextBlock from '../Text'

import Lock from '../../assets/images/lock.png'
import MIGRATOR_ABI from '../../constants/abis/migrator'
import { MIGRATOR_ADDRESS } from '../../constants'

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

const InlineSubText = styled.span`
  font-size: 12px;
`

const flash = keyframes`
  0% {}
  50% {
    border: 1px solid #27AE60;
  }
  100% {}
`

const AnimnatedCard = styled(Card)`
  animation: ${({ active }) => active && flash};
  animation-duration: 1s;
  animation-iteration-count: infinite;
`

// % above the calculated gas cost that we actually send, denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(1000)
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

function PoolUnit({ token, alreadyMigrated = false }) {
  const [open, toggleOpen] = useState(false)

  const { account } = useWeb3React()
  const allTokenDetails = useAllTokenDetails()
  const addTransaction = useTransactionAdder()

  const symbol = allTokenDetails[token].symbol
  const exchangeAddressV1 = allTokenDetails[token].exchangeAddress
  const exchangeAddressV2 = allTokenDetails[token].exchangeAddressV2

  const exchangeContractV1 = useExchangeContract(exchangeAddressV1)
  const migratorContract = useContract(MIGRATOR_ADDRESS, MIGRATOR_ABI)

  const v1Balance = useAddressBalance(account, exchangeAddressV1)
  const v1BalanceFormatted = v1Balance && ethers.utils.bigNumberify(v1Balance)

  const v2Balance = useAddressBalance(account, exchangeAddressV2)
  const v2BalanceFormatted = v2Balance && ethers.utils.bigNumberify(v2Balance)
  const v2BalancePrevious = usePrevious(v2BalanceFormatted) // used to see if balance increases

  const tokenAllowance = useAddressAllowance(account, exchangeAddressV1, MIGRATOR_ADDRESS)

  const [pendingApproval, setPendingApproval] = useState(false)
  const approvalDone = tokenAllowance && v1BalanceFormatted && tokenAllowance.gte(v1BalanceFormatted)

  const [pendingMigration, setPendingMigration] = useState(false)
  const migrationDone = useDoneMigrate(exchangeAddressV1)

  const [triggerFlash, setTriggerFlash] = useState(false)

  // reset pending state when on-chain data updates
  useEffect(() => {
    if (approvalDone) {
      setPendingApproval(false)
    }
  }, [approvalDone])

  useEffect(() => {
    if (migrationDone) {
      setPendingMigration(false)
    }
  }, [migrationDone])

  // trigger flash if new v2 liquidity detected
  useEffect(() => {
    if (v2BalanceFormatted > v2BalancePrevious) {
      setTimeout(() => {
        setTriggerFlash(true)
      }, 1000)
      setTimeout(() => {
        setTriggerFlash(false)
      }, 4000)
    }
  }, [v2BalanceFormatted, v2BalancePrevious])

  const tryApproval = async () => {
    setPendingApproval(true)
    const estimatedGasLimit = await exchangeContractV1.estimate.approve(MIGRATOR_ADDRESS, v1BalanceFormatted)
    exchangeContractV1 &&
      token &&
      v1BalanceFormatted &&
      exchangeContractV1
        .approve(MIGRATOR_ADDRESS, v1BalanceFormatted, {
          gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
        })
        .then(response => {
          addTransaction(response, { approval: token })
        })
        .catch(() => {
          setPendingApproval(false)
        })
  }

  const tryMigration = async () => {
    setPendingMigration(true)
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
        addTransaction(response, { migrate: exchangeAddressV1 })
      })
      .catch(() => {
        setPendingMigration(false)
      })
  }

  function DynamicCard() {
    return (
      <div>
        <AnimnatedCard outlined={open} style={migrationDone && !open ? { opacity: '0.9' } : {}} active={triggerFlash}>
          <Grouping>
            {migrationDone ? (
              <DoubleLogo
                size="24px"
                addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
                addressOne={token}
              />
            ) : (
              <TokenLogo size="24px" address={token} />
            )}
            {migrationDone && v2BalanceFormatted ? (
              <TextBlock fontSize={20}>
                {amountFormatter(v2BalanceFormatted, 18, 6) < 0.00001
                  ? '<0.00001 ' + allTokenDetails[token].symbol
                  : amountFormatter(v2BalanceFormatted, 18, 5) + ' ' + allTokenDetails[token].symbol}
                <InlineSubText>/ETH</InlineSubText> Pool Tokens
              </TextBlock>
            ) : (
              v1BalanceFormatted && (
                <TextBlock fontSize={20}>
                  {amountFormatter(v1BalanceFormatted, 18, 5) < 0.00001
                    ? '<0.00001 ' + allTokenDetails[token].symbol
                    : amountFormatter(v1BalanceFormatted, 18, 6) + ' ' + allTokenDetails[token].symbol}{' '}
                  Pool Tokens
                </TextBlock>
              )
            )}
            {migrationDone ? <Badge variant="green">V2</Badge> : <Badge variant="yellow">V1</Badge>}
            {!open ? (
              migrationDone ? (
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
            ) : migrationDone ? (
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
        </AnimnatedCard>
        {open && (
          <BottomWrapper>
            <FormattedCard outlined={!approvalDone && 'outlined'}>
              <Row>
                <TextBlock fontSize={20}>Step 1</TextBlock>
                {approvalDone || migrationDone ? (
                  <TextBlock color={'green2'}>✓</TextBlock>
                ) : pendingApproval ? (
                  <Loader />
                ) : (
                  ''
                )}
              </Row>
              <Button
                variant={(approvalDone || migrationDone) && 'success'}
                py={18}
                onClick={() => {
                  !approvalDone && tryApproval()
                }}
              >
                {approvalDone || migrationDone
                  ? 'Confirmed'
                  : pendingApproval
                  ? 'Waiting For Confirmation...'
                  : 'Approve for upgrade'}
              </Button>
              <TextBlock fontSize={16} color={'grey5'}>
                The upgrade helper needs your permssion to upgrade on your behalf
              </TextBlock>
            </FormattedCard>
            <FormattedCard outlined={approvalDone && 'outlined'}>
              <Row>
                <TextBlock fontSize={20}>Step 2</TextBlock>
                {pendingMigration ? (
                  <Loader />
                ) : migrationDone ? (
                  <TextBlock fontSize={20} color={'green2'}>
                    ✓
                  </TextBlock>
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
                {pendingMigration ? 'Waiting For Confirmation...' : migrationDone ? 'Confirmed' : 'Migrate Liquidity'}
              </Button>
              <TextBlock fontSize={16} color={'grey5'}>
                Your {symbol} Liquidity will appear as {symbol}/ETH wth a new icon. <Link>Read more.</Link>
              </TextBlock>
            </FormattedCard>
          </BottomWrapper>
        )}
      </div>
    )
  }

  function V2Card() {
    return (
      <AnimnatedCard mt={20} style={{ opacity: '0.9' }} active={triggerFlash}>
        <Grouping>
          <DoubleLogo
            size="24px"
            addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
            addressOne={token}
          />
          <TextBlock fontSize={20}>
            {amountFormatter(v2BalanceFormatted, 18, 6) < 0.00001
              ? '<0.00001 ' + allTokenDetails[token].symbol
              : amountFormatter(v2BalanceFormatted, 18, 5) + ' ' + allTokenDetails[token].symbol}
            <InlineSubText>/ETH</InlineSubText> Pool Tokens
          </TextBlock>
          <Badge variant="green">V2</Badge>
          <Icon variant="filled" fillColor="green2">
            ✓
          </Icon>
        </Grouping>
      </AnimnatedCard>
    )
  }

  const fadeTransition = useTransition(true, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  return fadeTransition.map(
    ({ item, key, props }) =>
      item && (
        <animated.div key={key} style={props}>
          {alreadyMigrated ? !migrationDone && V2Card() : DynamicCard()}
        </animated.div>
      )
  )
}

export default withRouter(PoolUnit)
