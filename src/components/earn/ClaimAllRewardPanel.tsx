import { AutoColumn, TopSection } from 'components/Column'
import Loader from 'components/Loader'
import { RowCenter, RowStart } from 'components/Row'
import { useDoTransaction } from 'components/swap/routing'
import { StakingRewards } from 'generated'
import { useStakingContracts } from 'hooks/useContract'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useFilteredStakingInfo } from 'state/stake/hooks'
import styled, { ThemeContext } from 'styled-components'
import { StyledLink, TYPE } from 'theme'

import { CardSection, TopBorderCard } from './styled'

const CooldownLimit = 24 * 60 * 60 * 1000
const CoolDownKey = 'LastClaimedTime'

export const Space = styled.span`
  width: 10px;
`

export interface ClaimAllRewardsProps {
  stakedFarms: FarmSummary[]
}

export default function ClaimAllRewardPanel({ stakedFarms }: ClaimAllRewardsProps) {
  const theme = useContext(ThemeContext)
  const { t } = useTranslation()

  const stakingAddresses = useMemo(() => {
    return stakedFarms.map((farm) => farm.lpAddress)
  }, [stakedFarms])

  const doTransaction = useDoTransaction()
  const stakingInfos = useFilteredStakingInfo(stakingAddresses)
  const contracts = useStakingContracts(stakingInfos)

  const memoizedContracts = useRef<StakingRewards[] | null>(null)
  const [pending, setPending] = useState<boolean>(false)
  const [pendingIndex, setPendingIndex] = useState<number>(0)
  const [lastClaimedTime, setLastClaimedTime] = useState<number>(0)

  useEffect(() => {
    const claimedTime = localStorage.getItem(CoolDownKey)
    if (claimedTime) setLastClaimedTime(Number(claimedTime))
  }, [])

  const startTransactions = () => {
    setPending(true)
    setPendingIndex(1)
    claimRewards()
  }

  const finishTransactions = () => {
    setPending(false)
    const currentTime = Date.now()
    setLastClaimedTime(currentTime)
    localStorage.setItem(CoolDownKey, currentTime.toString())
  }

  const claimRewards = async () => {
    if (!memoizedContracts.current) return
    let currentIndex = 1
    for (const contract of memoizedContracts.current) {
      await doTransaction(contract, 'getReward', {
        args: [],
        summary: `${t('ClaimAccumulatedUbeRewards')}`,
      })
        .catch(console.error)
        .finally(() => {
          console.log(currentIndex, ' index of transaction is completed')
        })
      setPendingIndex(++currentIndex)
    }
    finishTransactions()
  }

  const onClaimRewards = () => {
    memoizedContracts.current = contracts
    startTransactions()
  }

  const cooldownCheck = useMemo(() => {
    const deltaTime = Date.now() - lastClaimedTime
    return deltaTime >= CooldownLimit
  }, [lastClaimedTime])

  if (!cooldownCheck || !contracts || contracts?.length == 0) return <></>

  return (
    <TopSection gap="md">
      <TopBorderCard>
        <CardSection>
          <RowStart>
            <div style={{ paddingRight: 16 }}>
              <AlertCircle color={theme.green1} size={36} />
            </div>
            <AutoColumn gap="md">
              <RowCenter>
                <TYPE.black fontWeight={600}>
                  <Trans i18nKey="youHaveUnclaimedRewards" values={{ count: contracts?.length }} />
                </TYPE.black>
              </RowCenter>
              {pending && (
                <RowCenter>
                  <TYPE.black fontWeight={600}>{`${pendingIndex} / ${memoizedContracts?.current?.length}`}</TYPE.black>
                  <Space />
                  <Loader size="15px" />
                </RowCenter>
              )}
              {!pending && <StyledLink onClick={onClaimRewards}>{t('claimAllRewards')}</StyledLink>}
            </AutoColumn>
          </RowStart>
        </CardSection>
      </TopBorderCard>
    </TopSection>
  )
}
