import { Trans } from '@lingui/macro'
import { AutoColumn, Grid } from 'components/Column'
import { CardBGImage } from 'components/earn/styled'
import BondPositionCard from 'components/PositionCard/Bond'
import { RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { useGetAllBonds, usePurchaseBondCallback } from 'hooks/useBondDepository'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
import { IBond } from 'types/bonds'

const PageWrapper = styled(AutoColumn)`
  max-width: 900px;
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

const BondWrapper = styled.div`
  padding: 20px;
`

export default function Bonds() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()
  const purchaseBondCallback = usePurchaseBondCallback()
  const { bonds, isLoading } = useGetAllBonds()

  return (
    <PageWrapper>
      <CardBGImage />

      <AutoColumn justify="center" gap="md">
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
          <Grid>
            {bonds.map((bond: IBond, index: number) => (
              <BondWrapper key={index}>
                <BondPositionCard bond={bond} account={account} purchaseCallback={purchaseBondCallback} key={index} />
              </BondWrapper>
            ))}
          </Grid>
        )}
      </AutoColumn>
    </PageWrapper>
  )
}
