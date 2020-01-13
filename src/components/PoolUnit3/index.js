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
import { TextBlock } from '../Text'

import Lock from '../../assets/images/lock.png'
import MIGRATOR_ABI from '../../constants/abis/migrator'
import { MIGRATOR_ADDRESS } from '../../constants'

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

const flash = keyframes`
  0% {
   
  }
  50% {
    border: 1px solid #27AE60;
  }
  100% {
  }
`

const AnimnatedCard = styled(Card)`
  animation: ${({ active }) => active && flash};
  animation-duration: 1s;
  animation-iteration-count: infinite;
`

// % above the calculated gas cost that we actually send, denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(1000)
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

function Migrate({ token }) {
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
  const approvalDone = tokenAllowance && token && v1BalanceFormatted && tokenAllowance.gte(v1BalanceFormatted)

  const [pendingMigration, setPendingMigration] = useState(false)
  const migrationDone = useDoneMigrate(exchangeAddressV1)

  const hasV1 = v1BalanceFormatted && !v1BalanceFormatted.isZero()
  const hasV2 = v2BalanceFormatted && !v2BalanceFormatted.isZero()

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

  // close card on balance change
  useEffect(() => {
    if (!hasV1) {
      toggleOpen(false)
    }
  }, [hasV1])

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

  const tryApproval = () => {
    setPendingApproval(true)
    exchangeContractV1 &&
      token &&
      v1BalanceFormatted &&
      exchangeContractV1
        .approve(MIGRATOR_ADDRESS, v1BalanceFormatted)
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

  function V1Card() {
    return (
      <>
        <AnimnatedCard outlined={open} mt={20}>
          <Grouping>
            <TokenLogo size="24px" address={token} />
            <BodyText>
              {amountFormatter(v1BalanceFormatted, 18, 5) < 0.00001
                ? '<0.00001 ' + allTokenDetails[token].symbol
                : amountFormatter(v1BalanceFormatted, 18, 6) + ' ' + allTokenDetails[token].symbol}{' '}
              Pool Tokens
            </BodyText>
            <Badge variant="yellow">V1</Badge>
            {!open ? (
              <Button
                onClick={() => {
                  toggleOpen(true)
                }}
              >
                Upgrade
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
                {pendingMigration ? <Loader /> : approvalDone ? '' : <Icon icon={Lock} />}
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
              <SubText>
                Your {symbol} Liquidity will appear as {symbol}/ETH wth a new icon. <Link>Read more.</Link>
              </SubText>
            </FormattedCard>
          </BottomWrapper>
        )}
      </>
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
          <BodyText>
            {amountFormatter(v2BalanceFormatted, 18, 6) < 0.00001
              ? '<0.00001 ' + allTokenDetails[token].symbol
              : amountFormatter(v2BalanceFormatted, 18, 5) + ' ' + allTokenDetails[token].symbol}
            <InlineSubText>/ETH</InlineSubText> Pool Tokens
          </BodyText>
          <Badge variant="green">V2</Badge>
          <Icon variant="filled" fillColor="green2">
            ✓
          </Icon>
        </Grouping>
      </AnimnatedCard>
    )
  }

  /**
   * Cases (there must be some balance)
   *
   * Only v1 balance -> second card shows v1 info and then updated v2
   * Ony v2 -> second card shows v2 info
   * Both -> first card shows v1 info until its migrated away, second card always shows v2 info
   */

  const transitionsCard1 = useTransition(hasV1 && hasV2, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  const transitionsCard2 = useTransition(hasV1 || hasV2, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  return (
    <div>
      {transitionsCard1.map(
        ({ item, key, props }) =>
          item && (
            <animated.div key={key} style={props}>
              {V1Card()}
            </animated.div>
          )
      )}
      {transitionsCard2.map(
        ({ item, key, props }) =>
          item && (
            <animated.div key={key} style={props}>
              {hasV2 ? V2Card() : V1Card()}
            </animated.div>
          )
      )}
    </div>
  )
}

export default withRouter(Migrate)
