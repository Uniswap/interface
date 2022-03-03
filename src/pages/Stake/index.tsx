import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { StyledCurrencyInput } from 'components/NumericalInput'
import { FixedHeightRow } from 'components/PositionCard'
import { AutoRow } from 'components/Row'
import Toggle from 'components/Toggle'
import { DAO_STAKING } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { G_GEN, GEN, S_GEN } from 'constants/tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useStakeGenCallback, useUnstakeGenCallback } from 'hooks/useStakeGen'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance, useGGenToGenBalance } from 'state/wallet/hooks'
import { ThemeContext } from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import AppBody from '../AppBody'

export default function Stake({ history }: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()
  const [stake, setStake] = useState<boolean>(true)
  const [amount, setAmount] = useState<number>(0)

  const [stakingToken, setStakingToken] = useState<{ token: Token; isSGen: boolean }>({
    token: S_GEN,
    isSGen: true,
  })

  const [genApproval, genApproveCallback] = useApproveCallback(
    tryParseAmount('100000000000000', GEN),
    DAO_STAKING[SupportedChainId.POLYGON_MUMBAI] // TODO: make chain selection dynamic
  )
  const [sGenApproval, sGenApproveCallback] = useApproveCallback(
    tryParseAmount('100000000000000', GEN),
    DAO_STAKING[SupportedChainId.POLYGON_MUMBAI] // TODO: make chain selection dynamic
  )

  const stakeGen = useStakeGenCallback({
    amount,
    account,
    rebasing: stakingToken.isSGen,
    stakingTokenName: stakingToken.token.name,
  })
  const unstakeGen = useUnstakeGenCallback({
    amount,
    account,
    rebasing: stakingToken.isSGen,
    unstakingTokenName: stakingToken.token.name,
  })

  const genBalance = useCurrencyBalance(account ? account : undefined, GEN)
  const sGenBalance = useCurrencyBalance(account ? account : undefined, S_GEN)
  const gGenBalance = useCurrencyBalance(account ? account : undefined, G_GEN)
  const gGenToSGenBalance = useGGenToGenBalance(account ? account : undefined, G_GEN)

  const onToggle = () =>
    stakingToken.isSGen
      ? setStakingToken({ token: G_GEN, isSGen: false })
      : setStakingToken({ token: S_GEN, isSGen: true })

  const handleStakeGen = async () => {
    try {
      await stakeGen()
    } catch (error) {}
  }

  const handleUnstakeGen = async () => {
    try {
      await unstakeGen()
    } catch (error) {}
  }

  return (
    <AppBody>
      <AutoRow style={{ padding: '1rem' }} justify="space-between">
        <AutoColumn>
          <Toggle isActive={stake} toggle={() => setStake(!stake)} checked="Stake" unchecked="Unstake" />
        </AutoColumn>
        <AutoColumn>
          <Toggle isActive={stakingToken.isSGen} toggle={onToggle} checked={S_GEN.name} unchecked={G_GEN.name} />
        </AutoColumn>
      </AutoRow>

      <AutoRow style={{ padding: '1rem' }}>
        <StyledCurrencyInput
          value={amount}
          onUserInput={(amount) => setAmount(+amount)}
          placeholder={'0'}
          fontSize="30px"
        />
      </AutoRow>

      <AutoColumn gap="8px" style={{ padding: '1rem' }}>
        <FixedHeightRow>
          <Text fontSize={16} fontWeight={500}>
            <Trans>Unstaked Balance:</Trans>
          </Text>
          <Text fontSize={16} fontWeight={500}>
            {formatCurrencyAmount(genBalance, 2)} {GEN.symbol}
          </Text>
        </FixedHeightRow>

        <FixedHeightRow>
          <Text fontSize={16} fontWeight={500}>
            <Trans>Total Staked Balance:</Trans>
          </Text>
          <Text fontSize={16} fontWeight={500}>
            {/* $ {trim(`${bond.priceUSD}`, 3)} */}
          </Text>
        </FixedHeightRow>

        <FixedHeightRow padding="0 15px">
          <Text fontSize={14} fontWeight={500} color={theme.text3}>
            <Trans>sGEN Balance:</Trans>
          </Text>
          <Text fontSize={14} fontWeight={500} color={theme.text3}>
            {formatCurrencyAmount(sGenBalance, 2)} {S_GEN.name}
          </Text>
        </FixedHeightRow>

        <FixedHeightRow marginBottom="30px" padding="0 15px">
          <Text fontSize={14} fontWeight={500} color={theme.text3}>
            <Trans>gGEN Balance:</Trans>
          </Text>
          <Text fontSize={14} fontWeight={500} color={theme.text3}>
            {formatCurrencyAmount(gGenBalance, 2)} {G_GEN.name}
          </Text>
        </FixedHeightRow>
      </AutoColumn>

      {stake ? (
        <AutoRow style={{ padding: '1rem' }}>
          {genApproval === ApprovalState.APPROVED ? (
            <ButtonPrimary onClick={handleStakeGen}>Stake to {stakingToken.token.name}</ButtonPrimary>
          ) : (
            <ButtonPrimary onClick={genApproveCallback}>Approve {GEN.symbol}</ButtonPrimary>
          )}
        </AutoRow>
      ) : (
        <AutoRow style={{ padding: '1rem' }}>
          {sGenApproval === ApprovalState.APPROVED ? (
            <ButtonPrimary onClick={handleUnstakeGen}>Unstake from {stakingToken.token.name}</ButtonPrimary>
          ) : (
            <ButtonPrimary onClick={sGenApproveCallback}>Approve {S_GEN.name}</ButtonPrimary>
          )}
        </AutoRow>
      )}
    </AppBody>
  )
}
