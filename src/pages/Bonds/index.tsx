import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import BondPositionCard from 'components/PositionCard/Bond'
import { RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { useGetAllBonds, usePurchaseBondCallback } from 'hooks/useBondDepository'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useEffect } from 'react'
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
  const { account } = useActiveWeb3React()
  const purchaseBondCallback = usePurchaseBondCallback()
  const { bonds, isLoading, error } = useGetAllBonds()

  useEffect(
    // () => console.log('🚀 ~ file: index.tsx ~ line 43 ~ Bonds ~ bonds', bonds, isLoading, error),
    () => console.log(),
    [bonds, isLoading, error]
  )

  return (
    <PageWrapper>
      <CardBGImage />
      <CardNoise />

      <AutoColumn gap="md">
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
          <>
            {bonds.map((bond: IBond, index: number) => (
              <BondPositionCard bond={bond} account={account} purchaseCallback={purchaseBondCallback} key={index} />
            ))}
          </>
        )}
      </AutoColumn>
    </PageWrapper>
  )
}
