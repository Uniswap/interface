import { Trans } from '@lingui/macro'
import { PurchaseBondCallback } from 'hooks/useBondDepository'
import { transparentize } from 'polished'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { IBond } from 'types/bonds'

import { ButtonEmpty, ButtonPrimary } from '../Button'
import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { CardNoise } from '../earn/styled'
import { AutoRow, RowFixed } from '../Row'
import { FixedHeightRow } from '.'

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `};
  position: relative;
  overflow: hidden;
`

interface IBondPositionCardProps {
  account: string | null | undefined
  bond: IBond
  purchaseCallback: PurchaseBondCallback
}

function BondPositionCard({ account, bond, purchaseCallback }: IBondPositionCardProps) {
  const [showMore, setShowMore] = useState<boolean>(false)

  const handlePurchase = async () => {
    console.log('Handling bond purchase')
    try {
      await purchaseCallback({ account, bond, amount: 10, maxPrice: 1 })
    } catch (error) {
      console.log('AN ERROR HAS OCCURED', error)
    }
  }

  return (
    <StyledPositionCard border="#cccccc" bgColor="#000000">
      <CardNoise />
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <AutoRow gap="8px">
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} url={bond.bondIconSvg} />
            <Text fontWeight={500} fontSize={20}>
              {bond.displayName.toUpperCase()}
            </Text>
          </AutoRow>

          <RowFixed gap="8px" style={{ marginRight: '4px' }}>
            <ButtonEmpty padding="6px 8px" $borderRadius="12px" width="100%" onClick={() => setShowMore(!showMore)}>
              {showMore ? (
                <>
                  <Trans>Less</Trans>
                  <ChevronUp size="20" style={{ marginLeft: '8px', height: '20px', minWidth: '20px' }} />
                </>
              ) : (
                <>
                  <Trans>More</Trans>
                  <ChevronDown size="20" style={{ marginLeft: '8px', height: '20px', minWidth: '20px' }} />
                </>
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                <Trans>Price:</Trans>
              </Text>
              <Text fontSize={16} fontWeight={500}>
                $ {bond.priceUSD}
              </Text>
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                <Trans>ROI:</Trans>
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {bond.discount} %
              </Text>
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                <Trans>Duration:</Trans>
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {bond.duration}
              </Text>
            </FixedHeightRow>

            <ButtonPrimary padding="8px" $borderRadius="8px" width="100%" onClick={handlePurchase}>
              <Trans>Bond</Trans>
            </ButtonPrimary>
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}

export default BondPositionCard
