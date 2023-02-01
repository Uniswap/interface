import { ChainId, MaxUint256, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { lighten } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat, X } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import HistoryIcon from 'components/Icons/History'
import VoteIcon from 'components/Icons/Vote'
import Wallet from 'components/Icons/Wallet'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import Input from 'components/NumericalInput'
import Row, { AutoRow, RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { useKyberDAOInfo, useKyberDaoStakeActions, useStakingInfo, useVotingInfo } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { isAddress, shortenAddress } from 'utils'

import KNCLogo from '../kncLogo'
import DelegateConfirmModal from './DelegateConfirmModal'
import MigrateModal from './MigrateModal'
import SwitchToEthereumModal, { useSwitchToEthereum } from './SwitchToEthereumModal'
import YourTransactionsModal from './YourTransactionsModal'

enum STAKE_TAB {
  Stake = 'Stake',
  Unstake = 'Unstake',
  Delegate = 'Delegate',
}
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 404px;
  order: 4;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    order: 2;
  `}
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const TabSelect = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 18px;

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    gap: inherit;
    justify-content: space-between;
  `}
`
const FormWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 16px;
  width: 100%;
`

export const InnerCard = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16));
`

export const SmallButton = styled.button`
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all ease-in-out 0.1s;
  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
    :hover {
      background-color: ${lighten(0.05, theme.tableHeader)};
    }
    :active {
      background-color: ${lighten(0.1, theme.tableHeader)};
    }
  `}
`

const TabOption = styled.div<{ $active?: boolean }>`
  font-size: 20px;
  line-height: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => lighten(0.1, theme.primary)};
  }
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    font-size: 16px;
    line-height: 20px;
    &:last-child {
      margin-left: 0;
    }
  `}
`
const StakeFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;
`
const YourStakedKNC = styled(FormWrapper)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`
const StakeForm = styled(FormWrapper)`
  display: flex;
  gap: 16px;
  flex-direction: column;
`

export const CurrencyInput = styled.input<{ disabled?: boolean }>`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme, disabled }) => (disabled ? theme.subText : theme.text)};
  font-size: 24px;
  width: 0;
  flex: 1;
  ${({ disabled }) =>
    disabled &&
    `
      cursor: not-allowed;
    `}
`

const AddressInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  min-width: 0;
  :disabled {
    color: ${({ theme }) => theme.border};
  }
`

export const KNCLogoWrapper = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 8px 12px 8px 8px;
  display: flex;
  color: ${({ theme }) => theme.subText};
  gap: 4px;
  font-size: 20px;
`

const GetKNCButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: ${({ theme }) => theme.subText};
`
const HistoryButton = styled(RowFit)`
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  :hover {
    color: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

const DelegatedAddressBadge = styled.div`
  font-size: 12px;
  line-height: 16px;
  padding: 4px 6px;
  border-radius: 30px;
  display: flex;
  gap: 4px;
  align-items: center;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
  user-select: none;
  margin-bottom: -8px;
  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `}

  > svg:hover {
    filter: brightness(1.2);
  }
`

export default function StakeKNCComponent() {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const kyberDAOInfo = useKyberDAOInfo()
  const { stakedBalance, KNCBalance, delegatedAddress } = useStakingInfo()
  const { calculateVotingPower } = useVotingInfo()
  const isDelegated = !!delegatedAddress && delegatedAddress !== account
  const { stake, unstake, delegate, undelegate } = useKyberDaoStakeActions()
  const [activeTab, setActiveTab] = useState(STAKE_TAB.Stake)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')
  const [featureText, setFeatureText] = useState('')
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState('1')
  const [transactionError, setTransactionError] = useState<string | undefined>()

  const isUndelegate = useRef(false)

  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  useEffect(() => {
    if (![ChainId.MAINNET, ChainId.GÖRLI].includes(chainId)) {
      setErrorMessage(undefined)
      return
    }
    // Check if too many decimals
    try {
      parseUnits(inputValue, 18)
    } catch {
      setErrorMessage(t`Invalid amount`)
      return
    }
    if (!inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0) {
      setErrorMessage(t`Invalid amount`)
    } else if (
      (parseFloat(inputValue) > parseFloat(formatUnits(KNCBalance)) && activeTab === STAKE_TAB.Stake) ||
      (parseFloat(inputValue) > parseFloat(formatUnits(stakedBalance)) && activeTab === STAKE_TAB.Unstake)
    ) {
      setErrorMessage(t`Insufficient amount`)
    } else if (activeTab === STAKE_TAB.Delegate && !isAddress(chainId, delegateAddress)) {
      setErrorMessage(t`Invalid Ethereum address`)
    } else if (activeTab === STAKE_TAB.Delegate && delegateAddress.toLowerCase() === account?.toLowerCase()) {
      setErrorMessage(t`Cannot delegate to your wallet address`)
    } else if (activeTab === STAKE_TAB.Delegate && delegateAddress.toLowerCase() === delegatedAddress?.toLowerCase()) {
      setErrorMessage(t`You already delegated to this address`)
    } else {
      setErrorMessage(undefined)
    }
  }, [
    chainId,
    inputValue,
    KNCBalance,
    stakedBalance,
    activeTab,
    delegateAddress,
    account,
    isDelegated,
    delegatedAddress,
  ])

  const toggleWalletModal = useWalletModalToggle()
  const toggleDelegateConfirm = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()
  const { mixpanelHandler } = useMixpanel()
  const [approvalKNC, approveCallback] = useApproveCallback(
    TokenAmount.fromRawAmount(
      new Token(chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET, kyberDAOInfo?.KNCAddress || '', 18, 'KNC'),
      MaxUint256,
    ),
    kyberDAOInfo?.staking,
  )

  const currentVotingPower = calculateVotingPower(formatUnits(stakedBalance))
  const newVotingPower = parseFloat(
    calculateVotingPower(formatUnits(stakedBalance), (activeTab === STAKE_TAB.Unstake ? '-' : '') + inputValue),
  )
  const deltaVotingPower = Math.abs(newVotingPower - parseFloat(currentVotingPower)).toPrecision(3)

  const handleStake = () => {
    switchToEthereum()
      .then(() => {
        setPendingText(t`Staking ${inputValue} KNC to KyberDAO`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_STAKE_CLICK, { amount: inputValue })
        stake(parseUnits(inputValue, 18), deltaVotingPower)
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(error => {
            setAttemptingTxn(false)
            setTxHash(undefined)
            setTransactionError(error?.message)
          })
      })
      .catch(() => setFeatureText(t`Staking KNC`))
  }

  const handleUnstake = () => {
    switchToEthereum()
      .then(() => {
        setPendingText(t`Unstaking ${inputValue} KNC from KyberDAO`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_UNSTAKE_CLICK, { amount: inputValue })
        unstake(parseUnits(inputValue, 18))
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(error => {
            setAttemptingTxn(false)
            setTransactionError(error?.message)
          })
      })
      .catch(() => setFeatureText(t`Unstaking KNC`))
  }

  const handleDelegate = () => {
    switchToEthereum()
      .then(() => {
        isUndelegate.current = false
        toggleDelegateConfirm()
      })
      .catch(error => {
        setFeatureText(t`Delegate`)
        setShowConfirm(false)
      })
  }

  const handleUndelegate = () => {
    switchToEthereum()
      .then(() => {
        isUndelegate.current = true
        toggleDelegateConfirm()
      })
      .catch(() => {
        setFeatureText(t`Undelegate`)
        setShowConfirm(false)
      })
  }

  const onDelegateConfirmed = useCallback(() => {
    if (!account) return
    if (isUndelegate.current) {
      setPendingText(t`You are undelegating your voting from ${delegatedAddress}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      undelegate(account)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
          setDelegateAddress('')
        })
        .catch(error => {
          setAttemptingTxn(false)
          setTransactionError(error?.message)
        })
    } else {
      setPendingText(t`You are delegating your voting power to ${delegateAddress}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_DELEGATE_CLICK, { delegateAddress: delegateAddress })
      delegate(delegateAddress)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
          setDelegateAddress('')
        })
        .catch(error => {
          setAttemptingTxn(false)
          setTransactionError(error?.message)
        })
    }
    toggleDelegateConfirm()
  }, [delegate, delegateAddress, account, delegatedAddress, toggleDelegateConfirm, undelegate, mixpanelHandler])

  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !inputValue) return 0
    return (parseFloat(kncPrice) * parseFloat(inputValue)).toFixed(2)
  }, [kncPrice, inputValue])

  const handleMaxClick = useCallback(
    (half?: boolean) => {
      const balance = activeTab === STAKE_TAB.Stake ? KNCBalance : stakedBalance
      setInputValue(formatUnits(balance.div(!!half ? 2 : 1)))
    },
    [activeTab, KNCBalance, stakedBalance],
  )

  // Reset input value on tab changes
  useEffect(() => {
    setInputValue('1')
  }, [activeTab])

  return (
    <Wrapper>
      <TabSelect>
        {Object.keys(STAKE_TAB).map((tab: string) => (
          <TabOption key={tab} onClick={() => setActiveTab(tab as STAKE_TAB)} $active={activeTab === tab}>
            {tab}
          </TabOption>
        ))}
      </TabSelect>
      <YourStakedKNC>
        <Text fontSize={12} lineHeight="16px" color={theme.subText}>
          <Trans>Your Staked KNC</Trans>
        </Text>
        <Text
          fontSize={16}
          lineHeight="20px"
          color={theme.text}
          display="flex"
          alignItems="center"
          style={{ gap: '8px' }}
        >
          <KNCLogo size={20} /> {formatUnits(stakedBalance)} KNC
        </Text>
      </YourStakedKNC>

      <StakeFormWrapper>
        <StakeForm>
          <RowBetween color={theme.subText}>
            <GetKNCButton to="/swap/ethereum/eth-to-knc">
              <Repeat size={16} />
              <Text fontSize={14}>
                <Trans>Get KNC</Trans>
              </Text>
            </GetKNCButton>
            {account && (
              <HistoryButton onClick={toggleYourTransactions}>
                <HistoryIcon size={18} /> <Text fontSize={14}>History</Text>
              </HistoryButton>
            )}
          </RowBetween>
          {(activeTab === STAKE_TAB.Stake || activeTab === STAKE_TAB.Unstake) && (
            <>
              <InnerCard>
                <RowBetween width={'100%'}>
                  <AutoRow gap="2px">
                    <SmallButton onClick={() => handleMaxClick()}>Max</SmallButton>
                    <SmallButton onClick={() => handleMaxClick(true)}>Half</SmallButton>
                  </AutoRow>
                  {activeTab === STAKE_TAB.Stake && (
                    <AutoRow gap="3px" justify="flex-end" color={theme.subText}>
                      <Wallet /> <Text fontSize={12}>{KNCBalance ? formatUnits(KNCBalance) : 0}</Text>
                    </AutoRow>
                  )}
                </RowBetween>
                <RowBetween>
                  <Input value={inputValue} onUserInput={setInputValue} />
                  <span style={{ color: theme.border, fontSize: '14px', marginRight: '6px' }}>~${kncValueInUsd}</span>
                  <KNCLogoWrapper>
                    <KNCLogo />
                    KNC
                  </KNCLogoWrapper>
                </RowBetween>
              </InnerCard>
              {account ? (
                <Row gap="12px">
                  {(approvalKNC === ApprovalState.NOT_APPROVED || approvalKNC === ApprovalState.PENDING) &&
                    [ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) &&
                    !errorMessage && (
                      <ButtonPrimary onClick={approveCallback} disabled={approvalKNC === ApprovalState.PENDING}>
                        {approvalKNC === ApprovalState.PENDING ? 'Approving...' : 'Approve'}
                      </ButtonPrimary>
                    )}
                  <ButtonPrimary
                    disabled={
                      [ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) &&
                      (approvalKNC !== ApprovalState.APPROVED || !!errorMessage)
                    }
                    margin="8px 0px"
                    onClick={() => {
                      if (activeTab === STAKE_TAB.Stake) {
                        handleStake()
                      } else {
                        handleUnstake()
                      }
                    }}
                  >
                    {errorMessage || (activeTab === STAKE_TAB.Stake ? t`Stake` : t`Unstake`)}
                  </ButtonPrimary>
                </Row>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <InfoHelper
                    size={20}
                    fontSize={12}
                    color={theme.primary}
                    text={t`Staking KNC is only available on Ethereum chain`}
                    style={{ marginRight: '5px' }}
                    placement="top"
                  />
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              )}
            </>
          )}
          {activeTab === STAKE_TAB.Delegate && (
            <>
              <RowBetween>
                <Text color={theme.subText} fontSize={12} lineHeight="16px">
                  <Trans>Delegate Address</Trans>
                </Text>
                {isDelegated && (
                  <MouseoverTooltip
                    text={t`You have already delegated your voting power to this address`}
                    placement="top"
                  >
                    <DelegatedAddressBadge>
                      <VoteIcon /> {shortenAddress(ChainId.MAINNET, delegatedAddress)}{' '}
                      <X style={{ cursor: 'pointer' }} size={16} onClick={handleUndelegate} />
                    </DelegatedAddressBadge>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <InnerCard>
                <AddressInput
                  value={delegateAddress}
                  onChange={e => {
                    setDelegateAddress(e.target.value)
                  }}
                  placeholder="Ethereum Address"
                />
              </InnerCard>
              <Text color={theme.subText} fontSize={12} lineHeight="14px" fontStyle="italic">
                <Trans>*Only delegate to Ethereum address</Trans>
              </Text>
              <ExpandableBox
                borderRadius="16px"
                backgroundColor={theme.buttonBlack}
                padding="16px"
                color={theme.subText}
                style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
                headerContent={
                  <AutoRow>
                    <ColumnCenter style={{ width: '30px', marginRight: '6px' }}>
                      <WarningIcon />
                    </ColumnCenter>
                    <Text fontSize={12} lineHeight="16px" color={theme.subText}>
                      <Trans>Important Notice: Kyber Network does not hold your funds or manage this process.</Trans>
                    </Text>
                  </AutoRow>
                }
                expandContent={
                  <Text margin={'0 20px 0 30px'} fontSize={12} lineHeight="16px">
                    <Trans>
                      In this default delegation method, your delegate is responsible for voting on your behalf and
                      distributing your KNC rewards to you, though only you can withdraw/unstake your own KNC
                    </Trans>
                  </Text>
                }
              />
              {account ? (
                <ButtonPrimary margin="8px 0px" onClick={handleDelegate} disabled={!!errorMessage}>
                  {errorMessage || <Trans>Delegate</Trans>}
                </ButtonPrimary>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <InfoHelper
                    size={20}
                    fontSize={12}
                    color={theme.primary}
                    text={t`Delegate is only available on Ethereum chain`}
                    style={{ marginRight: '5px' }}
                    placement="top"
                  />
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              )}
            </>
          )}
        </StakeForm>
      </StakeFormWrapper>
      <ExpandableBox
        border={`1px solid ${theme.border}`}
        backgroundColor={theme.buttonBlack}
        borderRadius="16px"
        color={theme.subText}
        padding={'12px 16px'}
        headerContent={
          <Text fontSize={12} color={theme.text} style={{ textTransform: 'uppercase' }}>
            <Trans>Stake Information</Trans>
          </Text>
        }
        expandContent={
          <AutoColumn gap="10px" style={{ fontSize: '12px' }}>
            <RowBetween>
              <Text>
                <Trans>Stake Amount</Trans>
              </Text>
              <Text>
                {formatUnits(stakedBalance)} KNC
                {activeTab !== STAKE_TAB.Delegate && (
                  <>
                    {' '}
                    &rarr;{' '}
                    <span style={{ color: theme.text }}>
                      {+formatUnits(stakedBalance) +
                        (activeTab === STAKE_TAB.Unstake ? -(inputValue || '0') : +(inputValue || '0'))}{' '}
                      KNC
                    </span>
                  </>
                )}
              </Text>
            </RowBetween>
            <RowBetween>
              <Text>
                <Trans>Voting power</Trans>{' '}
                <InfoHelper
                  text={t`Your voting power is calculated by [Your Staked KNC] / [Total Staked KNC] * 100%`}
                />
              </Text>
              <Text>
                {currentVotingPower}%
                {activeTab !== STAKE_TAB.Delegate && (
                  <>
                    {' '}
                    &rarr; <span style={{ color: theme.text }}>{newVotingPower}%</span>
                  </>
                )}
              </Text>
            </RowBetween>
          </AutoColumn>
        }
      />
      <SwitchToEthereumModal featureText={featureText} />
      <DelegateConfirmModal
        address={delegateAddress}
        isUndelegate={isUndelegate.current}
        delegatedAddress={delegatedAddress}
        onAddressChange={setDelegateAddress}
        delegateCallback={onDelegateConfirmed}
      />
      <YourTransactionsModal />
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        pendingText={pendingText}
        content={() => {
          if (transactionError) {
            return <TransactionErrorContent onDismiss={() => setShowConfirm(false)} message={transactionError} />
          } else {
            return <></>
          }
        }}
      />
      <MigrateModal
        setPendingText={setPendingText}
        setShowConfirm={setShowConfirm}
        setAttemptingTxn={setAttemptingTxn}
        setTxHash={setTxHash}
        setTransactionError={setTransactionError}
      />
    </Wrapper>
  )
}
