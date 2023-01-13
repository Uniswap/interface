import { Trans } from '@lingui/macro'
import { ListingMarket } from 'nft/types'
// eslint-disable-next-line no-restricted-imports
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FeeWrap = styled.div`
  margin-bottom: 4px;
  color: ${({ theme }) => theme.textPrimary};
`

const RoyaltyContainer = styled(ThemedText.BodySmall)`
  margin-bottom: 8px;
`

export const RoyaltyTooltip = ({ selectedMarket }: { selectedMarket: ListingMarket }) => {
  return (
    <RoyaltyContainer key={selectedMarket.name}>
      <FeeWrap>
        {selectedMarket.name}: {selectedMarket.fee}%
      </FeeWrap>
      <FeeWrap>
        <Trans>Creator royalties</Trans>: {selectedMarket.royalty}%
      </FeeWrap>
    </RoyaltyContainer>
  )
}
