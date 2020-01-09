import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'
import { animated, useTransition, useSpring } from 'react-spring'

import { useWeb3React, useContract, useExchangeContract, usePrevious } from '../../hooks'
import { useAllTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder, usePendingMigrate, useDoneMigrate } from '../../contexts/Transactions'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useAddressBalance } from '../../contexts/Balances'

import { calculateGasMargin, amountFormatter, getV2FactoryContract } from '../../utils'

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
import { BigNumber } from 'ethers/utils'

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

const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

function Migrate({ token }) {
  const [open, toggleOpen] = useState(false)

  const { account, chainId, library } = useWeb3React()
  const allTokenDetails = useAllTokenDetails()
  const addTransaction = useTransactionAdder()

  const symbol = allTokenDetails[token].symbol
  const exchangeAddressV1 = allTokenDetails[token].exchangeAddress
  let exchangeAddressV2 = allTokenDetails[token].exchangeAddressV2

  const exchangeContractV1 = useExchangeContract(exchangeAddressV1)
  const migratorContract = useContract(MIGRATOR_ADDRESS, MIGRATOR_ABI)

  // const v1Balance = useAddressBalance(account, exchangeAddressV1)
  // const v1BalanceFormatted = v1Balance && ethers.utils.bigNumberify(v1Balance)
  // const v2Balance = useAddressBalance(account, exchangeAddressV2)
  // const v2BalanceFormatted = v2Balance && ethers.utils.bigNumberify(v2Balance)

  const [v1BalanceFormatted, setV1Balance] = useState(ethers.utils.bigNumberify(2000000000000000))
  const [v2BalanceFormatted, setV2Balance] = useState(ethers.utils.bigNumberify(0))
  const v2Previous = usePrevious(v2BalanceFormatted)

  const [triggerFlash, setTriggerFlash] = useState(false)

  useEffect(() => {})

  const tokenAllowance = useAddressAllowance(account, exchangeAddressV1, MIGRATOR_ADDRESS)

  const [pendingApproval, setPendingApproval] = useState(false)
  // const pendingMigration = usePendingMigrate(exchangeAddressV1)
  const [pendingMigration, setPendingMigration] = useState(false)
  const [confirmingMigration, setConfirmingMigration] = useState(false)

  // const approvalDone = tokenAllowance && token && v1BalanceFormatted && tokenAllowance.gte(v1BalanceFormatted)
  const [approvalDone, setApprovalDone] = useState(false)
  // const migrationDone = useDoneMigrate(exchangeAddressV1)
  const [migrationDone, setMigrationDone] = useState(false)

  useEffect(() => {
    if (migrationDone) {
      if (!exchangeAddressV2) {
      }
    }
  }, [migrationDone, exchangeAddressV2])

  // if (token && chainId && library && account) {
  //   const newE = getV2FactoryContract(chainId, library, account)
  //   let newExchange = newE.getExchange(token, '0xc778417E063141139Fce010982780140Aa0cD5Ab').then(res => {
  //     // console.log(res)
  //   })
  // }

  useEffect(() => {
    if (approvalDone) {
      setPendingApproval(false)
    }
  }, [approvalDone])

  const tryApproval = () => {
    setPendingApproval(true)
    setTimeout(function() {
      setPendingApproval(false)
      setApprovalDone(true)
    }, 1000)
    // exchangeContractV1 &&
    //   token &&
    //   v1BalanceFormatted &&
    //   exchangeContractV1
    //     .approve(MIGRATOR_ADDRESS, v1BalanceFormatted)
    //     .then(response => {
    //       addTransaction(response, { approval: token })
    //     })
    //     .catch(() => {
    //       setPendingApproval(false)
    //     })
  }

  // % above the calculated gas cost that we actually send, denominated in bips
  const GAS_MARGIN = ethers.utils.bigNumberify(1000)

  const tryMigration = async () => {
    setConfirmingMigration(true)
    // const now = Math.ceil(Date.now() / 1000)
    // const estimatedGasLimit = await migratorContract.estimate.migrate(
    //   token,
    //   0,
    //   0,
    //   account,
    //   now + DEFAULT_DEADLINE_FROM_NOW
    // )
    // migratorContract
    //   .migrate(token, 0, 0, account, now + DEFAULT_DEADLINE_FROM_NOW, {
    //     gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    //   })
    //   .then(response => {
    //     setConfirmingMigration(false)
    //     addTransaction(response, { migrate: exchangeAddressV1 })
    //   })
    //   .catch(() => {
    //     setConfirmingMigration(false)
    //   })
    setTimeout(function() {
      setConfirmingMigration(false)
      // setApprovalDone(true)
      setPendingMigration(false)
      setMigrationDone(true)
      setV1Balance(ethers.utils.bigNumberify(0))
      setV2Balance(ethers.utils.bigNumberify(4000000000000000))
    }, 1000)
  }

  const showCard1 =
    v1BalanceFormatted && !v1BalanceFormatted.isZero() && v2BalanceFormatted && !v2BalanceFormatted.isZero()

  const hasV2 = v2BalanceFormatted && !v2BalanceFormatted.isZero()

  const transitionsCard1 = useTransition(showCard1, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  const transitionsCard2 = useTransition(true, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  useEffect(() => {
    if (v2BalanceFormatted > v2Previous) {
      setTimeout(() => {
        setTriggerFlash(true)
      }, 1000)
      setTimeout(() => {
        setTriggerFlash(false)
      }, 3000)
    }
  }, [v2BalanceFormatted, v2Previous])

  return (
    <div>
      {transitionsCard1.map(
        ({ item, key, props }) =>
          item && (
            <animated.div key={key} style={props}>
              <AnimnatedCard
                outlined={open}
                mt={'1rem'}
                style={migrationDone && !open ? { opacity: '0.9' } : {}}
                active={triggerFlash}
              >
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
                      {approvalDone
                        ? 'Confirmed'
                        : pendingApproval
                        ? 'Waiting For Confirmation...'
                        : 'Approve for upgrade'}
                    </Button>
                    <SubText>The upgrade helper needs your permssion to upgrade on your behalf</SubText>
                  </FormattedCard>
                  <FormattedCard outlined={approvalDone && 'outlined'}>
                    <Row>
                      <BodyText>Step 2</BodyText>
                      {pendingMigration || confirmingMigration ? <Loader /> : approvalDone ? '' : <Icon icon={Lock} />}
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
            </animated.div>
          )
      )}
      {transitionsCard2.map(
        ({ item, key, props }) =>
          item && (
            <animated.div key={key} style={props}>
              <AnimnatedCard
                outlined={open}
                mt={'1rem'}
                style={hasV2 || (!hasV2 && migrationDone && !open) ? { opacity: '0.6' } : {}}
                active={triggerFlash}
              >
                <Grouping>
                  {hasV2 ? (
                    <DoubleLogo
                      size="24px"
                      addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'} //weth has better logo than eth
                      addressOne={token}
                    />
                  ) : (
                    <TokenLogo size="24px" address={token} />
                  )}
                  {hasV2 ? (
                    <BodyText>
                      {amountFormatter(v2BalanceFormatted, 18, 6) < 0.00001
                        ? '<0.00001 ' + allTokenDetails[token].symbol
                        : amountFormatter(v2BalanceFormatted, 18, 5) + ' ' + allTokenDetails[token].symbol}
                      <InlineSubText>/ETH</InlineSubText> Pool Tokens
                    </BodyText>
                  ) : (
                    <BodyText>
                      {amountFormatter(v1BalanceFormatted, 18, 5) < 0.00001
                        ? '<0.00001 ' + allTokenDetails[token].symbol
                        : amountFormatter(v1BalanceFormatted, 18, 6) + ' ' + allTokenDetails[token].symbol}{' '}
                      Pool Tokens
                    </BodyText>
                  )}
                  {hasV2 ? <Badge variant="green">V2</Badge> : <Badge variant="yellow">V1</Badge>}
                  {hasV2 || (!hasV2 && !open) ? (
                    hasV2 ? (
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
              </AnimnatedCard>
              {!hasV2 && open && (
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
                      {approvalDone
                        ? 'Confirmed'
                        : pendingApproval
                        ? 'Waiting For Confirmation...'
                        : 'Approve for upgrade'}
                    </Button>
                    <SubText>The upgrade helper needs your permssion to upgrade on your behalf</SubText>
                  </FormattedCard>
                  <FormattedCard outlined={approvalDone && 'outlined'}>
                    <Row>
                      <BodyText>Step 2</BodyText>
                      {!hasV2 && (pendingMigration || confirmingMigration) ? (
                        <Loader />
                      ) : hasV2 ? (
                        <GreenText>✓</GreenText>
                      ) : approvalDone ? (
                        ''
                      ) : (
                        <Icon icon={Lock} />
                      )}
                    </Row>
                    <Button
                      variant={hasV2 && 'success'}
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
            </animated.div>
          )
      )}
    </div>
  )
}

export default withRouter(Migrate)
