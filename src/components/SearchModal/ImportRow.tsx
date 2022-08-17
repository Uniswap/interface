import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import ListLogo from 'components/ListLogo'
import { AutoRow, RowFixed } from 'components/Row'
import { useIsTokenActive, useIsUserAddedToken } from 'hooks/Tokens'
import { CSSProperties } from 'react'
import { CheckCircle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'

const TokenSection = styled.div<{ dim?: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto;
  grid-gap: 16px;
  align-items: center;

  opacity: ${({ dim }) => (dim ? '0.4' : '1')};
`

const CheckIcon = styled(CheckCircle)`
  height: 16px;
  width: 16px;
  margin-right: 6px;
  stroke: ${({ theme }) => theme.deprecated_green1};
`

const NameOverflow = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  font-size: 12px;
`

export default function ImportRow({
  token,
  style,
  dim,
  showImportView,
  setImportToken,
}: {
  token: Token
  style?: CSSProperties
  dim?: boolean
  showImportView: () => void
  setImportToken: (token: Token) => void
}) {
  const theme = useTheme()

  // check if already active on list or local storage tokens
  const isAdded = useIsUserAddedToken(token)
  const isActive = useIsTokenActive(token)

  const list = token instanceof WrappedTokenInfo ? token.list : undefined

  return (
    <TokenSection tabIndex={0} style={style}>
      <CurrencyLogo currency={token} size={'24px'} style={{ opacity: dim ? '0.6' : '1' }} />
      <AutoColumn gap="4px" style={{ opacity: dim ? '0.6' : '1' }}>
        <AutoRow>
          <ThemedText.DeprecatedBody fontWeight={500}>{token.symbol}</ThemedText.DeprecatedBody>
          <ThemedText.DeprecatedDarkGray ml="8px" fontWeight={300}>
            <NameOverflow title={token.name}>{token.name}</NameOverflow>
          </ThemedText.DeprecatedDarkGray>
        </AutoRow>
        {list && list.logoURI && (
          <RowFixed>
            <ThemedText.DeprecatedSmall mr="4px" color={theme.deprecated_text3}>
              <Trans>via {list.name} </Trans>
            </ThemedText.DeprecatedSmall>
            <ListLogo logoURI={list.logoURI} size="12px" />
          </RowFixed>
        )}
      </AutoColumn>
      {!isActive && !isAdded ? (
        <ButtonPrimary
          width="fit-content"
          padding="6px 12px"
          fontWeight={500}
          fontSize="14px"
          onClick={() => {
            setImportToken && setImportToken(token)
            showImportView()
          }}
        >
          <Trans>Import</Trans>
        </ButtonPrimary>
      ) : (
        <RowFixed style={{ minWidth: 'fit-content' }}>
          <CheckIcon />
          <ThemedText.DeprecatedMain color={theme.deprecated_green1}>
            <Trans>Active</Trans>
          </ThemedText.DeprecatedMain>
        </RowFixed>
      )}
    </TokenSection>
  )
}
