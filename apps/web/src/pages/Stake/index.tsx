import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { CardNoise, CardSection, DataCard } from 'components/earn/styled'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { ButtonRadio } from '../../components-old/Button'

import { NewStake } from './NewStake'
import { OldStake } from './OldStake'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const StyledButtonRadio = styled(ButtonRadio)({
  padding: '8px',
  borderRadius: '4px',
})

export const StakePage: React.FC = () => {
  const { t } = useTranslation()
  const [newStake, setNewStake] = useState(true)

  return (
    <>
      <TopSection gap="lg" justify="center">
        <DataCard style={{ marginBottom: '2px' }}>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <ThemedText.DeprecatedWhite fontWeight={600}>{t('UBEStakingAndGovernance')}</ThemedText.DeprecatedWhite>
              </RowBetween>
              <RowBetween>
                <ThemedText.DeprecatedWhite fontSize={14}>
                  {t('StakeUBEToParticipateInGovernanceAndEarnUbeRewards')}
                </ThemedText.DeprecatedWhite>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </DataCard>

        <div style={{ margin: '10px 0 0 6px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '200px' }}>
            <StyledButtonRadio active={newStake} onClick={() => setNewStake(true)}>
              New Stake
            </StyledButtonRadio>
          </div>
          <div style={{ width: '200px' }}>
            <StyledButtonRadio active={!newStake} onClick={() => setNewStake(false)}>
              Old Stake
            </StyledButtonRadio>
          </div>
        </div>

        {newStake ? <NewStake /> : <OldStake />}
      </TopSection>
    </>
  )
}

export default StakePage
