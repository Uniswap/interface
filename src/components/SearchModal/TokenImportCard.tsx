import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { TokenList } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import ListLogo from 'components/ListLogo'
import { RowFixed } from 'components/Row'
import { transparentize } from 'polished'
import { AlertCircle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const WarningWrapper = styled(Card)<{ highWarning: boolean }>`
  background-color: ${({ theme, highWarning }) =>
    highWarning ? transparentize(0.8, theme.deprecated_red1) : transparentize(0.8, theme.deprecated_yellow2)};
  width: fit-content;
`

const AddressText = styled(ThemedText.DeprecatedBlue)`
  font-size: 12px;
  word-break: break-all;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 10px;
  `}
`
interface TokenImportCardProps {
  list?: TokenList
  token: Token
}
const TokenImportCard = ({ list, token }: TokenImportCardProps) => {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  return (
    <Card backgroundColor={theme.deprecated_bg2} padding="2rem">
      <AutoColumn gap="10px" justify="center">
        <CurrencyLogo currency={token} size={'32px'} />
        <AutoColumn gap="4px" justify="center">
          <ThemedText.DeprecatedBody ml="8px" mr="8px" fontWeight={500} fontSize={20}>
            {token.symbol}
          </ThemedText.DeprecatedBody>
          <ThemedText.DeprecatedDarkGray fontWeight={400} fontSize={14}>
            {token.name}
          </ThemedText.DeprecatedDarkGray>
        </AutoColumn>
        {chainId && (
          <ExternalLink href={getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS)}>
            <AddressText fontSize={12}>{token.address}</AddressText>
          </ExternalLink>
        )}
        {list !== undefined ? (
          <RowFixed>
            {list.logoURI && <ListLogo logoURI={list.logoURI} size="16px" />}
            <ThemedText.DeprecatedSmall ml="6px" fontSize={14} color={theme.deprecated_text3}>
              <Trans>via {list.name} token list</Trans>
            </ThemedText.DeprecatedSmall>
          </RowFixed>
        ) : (
          <WarningWrapper $borderRadius="4px" padding="4px" highWarning={true}>
            <RowFixed>
              <AlertCircle stroke={theme.deprecated_red1} size="10px" />
              <ThemedText.DeprecatedBody color={theme.deprecated_red1} ml="4px" fontSize="10px" fontWeight={500}>
                <Trans>Unknown Source</Trans>
              </ThemedText.DeprecatedBody>
            </RowFixed>
          </WarningWrapper>
        )}
      </AutoColumn>
    </Card>
  )
}

export default TokenImportCard
