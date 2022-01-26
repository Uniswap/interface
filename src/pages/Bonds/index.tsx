import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import BondPositionCard from 'components/PositionCard/Bond'
import { RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { useGetAllBonds } from 'hooks/useBondDepository'
import { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
import { IBond } from 'types/bonds'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Bonds() {
  const theme = useContext(ThemeContext)

  const { bonds, isLoading, error } = useGetAllBonds()

  return (
    <PageWrapper>
      <CardBGImage />
      <CardNoise />

      <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
        <HideSmall>
          <ThemedText.MediumHeader style={{ marginTop: '0.5rem', marginBottom: '0.5rem', justifySelf: 'flex-start' }}>
            <Trans>Bonds available</Trans>
          </ThemedText.MediumHeader>
        </HideSmall>
      </TitleRow>
      {isLoading ? (
        <EmptyProposals>
          <ThemedText.Body color={theme.text3} textAlign="center">
            <Dots>
              <Trans>Loading</Trans>
            </Dots>
          </ThemedText.Body>
        </EmptyProposals>
      ) : (
        <AutoColumn>
          {bonds.map((bond: IBond, index: number) => (
            <BondPositionCard bond={bond} key={index} />
          ))}
        </AutoColumn>
      )}
    </PageWrapper>
  )
}
