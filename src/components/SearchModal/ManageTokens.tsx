import React, { useRef, RefObject, useCallback, useState, useMemo, useContext } from 'react'
import { getExplorerLink } from '../../utils'
import { PaddedColumn, Separator, SearchInput } from './styleds'
import Row, { RowBetween, RowFixed } from '../Row'
import { TYPE, ExternalLink } from '../../theme'
import { useToken } from '../../hooks/Tokens'
import styled, { ThemeContext } from 'styled-components'
import { useUserAddedTokens, useRemoveUserAddedToken } from '../../state/user/hooks'
import { Token } from 'dxswap-sdk'
import CurrencyLogo from '../CurrencyLogo'
import { isAddress } from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import Card from '../Card'
import ImportRow from './ImportRow'

import { CurrencyModalView } from './CurrencySearchModal'
import { Trash } from 'react-feather'
import { Box, Flex } from 'rebass'
import { ButtonOutlined } from '../Button'

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`

const Footer = styled.div`
  width: 100%;
  border-radius: 20px;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-top: 1px solid ${({ theme }) => theme.bg3};
  padding: 20px;
  text-align: center;
`

const TrashIcon = styled(Trash)`
  cursor: pointer;
  width: 15px;
  height: 15px;
`

export default function ManageTokens({
  setModalView,
  setImportToken
}: {
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
}) {
  const { chainId } = useActiveWeb3React()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const theme = useContext(ThemeContext)

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }, [])

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)
  const searchToken = useToken(searchQuery)

  // all tokens for local lisr
  const userAddedTokens: Token[] = useUserAddedTokens()
  const removeToken = useRemoveUserAddedToken()

  const handleRemoveAll = useCallback(() => {
    if (chainId && userAddedTokens) {
      userAddedTokens.map(token => {
        return removeToken(chainId, token.address)
      })
    }
  }, [removeToken, userAddedTokens, chainId])

  const tokenList = useMemo(() => {
    return (
      chainId &&
      userAddedTokens.map(token => (
        <RowBetween key={token.address} width="100%">
          <RowFixed>
            <CurrencyLogo currency={token} size={'20px'} />
            <ExternalLink href={getExplorerLink(chainId, token.address, 'address')}>
              <TYPE.main ml={'10px'} fontWeight={600}>
                {token.symbol}
              </TYPE.main>
            </ExternalLink>
          </RowFixed>
          <RowFixed>
            <TrashIcon onClick={() => removeToken(chainId, token.address)} />
            <ExternalLink href={getExplorerLink(chainId, token.address, 'address')} />
          </RowFixed>
        </RowBetween>
      ))
    )
  }, [userAddedTokens, chainId, removeToken])

  return (
    <Wrapper>
      <Flex width="100%" height="100%" flexDirection="column">
        <Box>
          <PaddedColumn gap="14px">
            <Row>
              <SearchInput
                type="text"
                id="token-search-input"
                placeholder={'0x0000'}
                value={searchQuery}
                autoComplete="off"
                ref={inputRef as RefObject<HTMLInputElement>}
                onChange={handleInput}
              />
            </Row>
            {searchQuery !== '' && !isAddressSearch && <TYPE.error error={true}>Enter valid token address</TYPE.error>}
            {searchToken && (
              <Card backgroundColor={theme.bg2} padding="10px 0">
                <ImportRow
                  token={searchToken}
                  showImportView={() => setModalView(CurrencyModalView.IMPORT_TOKEN)}
                  setImportToken={setImportToken}
                  style={{ height: 'fit-content' }}
                />
              </Card>
            )}
          </PaddedColumn>
        </Box>
        <Box>
          <Separator />
        </Box>
        <Box flex="1">
          <PaddedColumn gap="lg" style={{ overflow: 'auto', marginBottom: '10px' }}>
            <RowBetween>
              <TYPE.main fontSize="14px">
                {userAddedTokens?.length} custom {userAddedTokens.length === 1 ? 'token' : 'tokens'}
              </TYPE.main>
              {userAddedTokens.length > 0 && (
                <ButtonOutlined style={{ padding: 0, width: 'auto' }} onClick={handleRemoveAll}>
                  Clear all
                </ButtonOutlined>
              )}
            </RowBetween>
            {tokenList}
          </PaddedColumn>
        </Box>
        <Box>
          <Footer>
            <TYPE.darkGray fontSize="14px">Tip: custom tokens are stored locally in your browser</TYPE.darkGray>
          </Footer>
        </Box>
      </Flex>
    </Wrapper>
  )
}
