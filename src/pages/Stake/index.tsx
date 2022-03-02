import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { StyledCurrencyInput } from 'components/NumericalInput'
import { AutoRow } from 'components/Row'
import Toggle from 'components/Toggle'
import { DAO_STAKING } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { G_GEN, GEN, S_GEN } from 'constants/tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useStakeGenCallback } from 'hooks/useStakeGen'
import { useActiveWeb3React } from 'hooks/web3'
import { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { tryParseAmount } from 'state/swap/hooks'

import AppBody from '../AppBody'

export default function Stake({ history }: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account } = useActiveWeb3React()
  const [stake, setStake] = useState<boolean>(true)
  const [amount, setAmount] = useState<number>(0)
  const [stakingToken, setStakingToken] = useState<{ token: Token; isSGen: boolean }>({
    token: S_GEN,
    isSGen: true,
  })
  const [approval, approveCallback] = useApproveCallback(
    tryParseAmount('100000000000000', GEN),
    DAO_STAKING[SupportedChainId.POLYGON_MUMBAI] // TODO: make chain selection dynamic
  )
  const stakeGen = useStakeGenCallback({
    amount,
    account,
    stakingTokenName: stakingToken.token.name,
    rebasing: stakingToken.isSGen,
  })

  const onToggle = () =>
    stakingToken.isSGen
      ? setStakingToken({ token: G_GEN, isSGen: false })
      : setStakingToken({ token: S_GEN, isSGen: true })

  const handleStakeGen = async () => {
    try {
      await stakeGen()
    } catch (error) {
      console.log(error)
    }
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

      <AutoRow style={{ padding: '1rem' }}></AutoRow>

      <AutoRow style={{ padding: '1rem' }}>
        {approval === ApprovalState.APPROVED ? (
          <ButtonPrimary onClick={handleStakeGen}>
            {stake ? 'Stake to ' : 'Unstake from '}
            {stakingToken.token.name}
          </ButtonPrimary>
        ) : (
          <ButtonPrimary onClick={approveCallback}>Approve GEN</ButtonPrimary>
        )}
      </AutoRow>
    </AppBody>
  )
}
