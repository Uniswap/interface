import { UserAmounts } from '@ichidao/ichi-vaults-sdk'
import { SmallButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Icons/LoadingSpinner'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import { Trans } from 'i18n'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'

const LinkRow = styled(Link)`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.neutral1};
  padding: 16px;
  text-decoration: none;
  font-weight: 535;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.deprecated_hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const ManageButton = styled(SmallButtonPrimary)`
  padding: 6px 12px;
  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }
`

interface PositionListItemProps {
  token0: string
  token1: string
  vaultAddress: string
  amounts: UserAmounts
}

export default function PositionListItem({
  token0: token0Address,
  token1: token1Address,
  vaultAddress,
  amounts,
}: PositionListItemProps) {
  const { formatNumber } = useFormatter()
  const navigate = useNavigate()

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const positionSummaryLink = '/ichivault/' + vaultAddress
  const onManageClicked = () => {
    navigate(positionSummaryLink)
  }

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={18} margin />
          <ThemedText.SubHeader style={{ fontWeight: 'bold' }}>
            &nbsp;
            {formatNumber({
              input: parseFloat(amounts.amount0),
              type: NumberType.TokenNonTx,
            })}
            &nbsp;{currency0?.symbol}
          </ThemedText.SubHeader>
          <ThemedText.SubHeader style={{ margin: '0 10px' }}>on</ThemedText.SubHeader>
          <ThemedText.SubHeader>
            {currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol} Vault
          </ThemedText.SubHeader>
        </PrimaryPositionIdData>
        <ManageButton onClick={() => onManageClicked()}>
          <Trans>Manage</Trans>
        </ManageButton>
      </RowBetween>

      {currency0 && currency1 ? <div></div> : <Loader />}
    </LinkRow>
  )
}
