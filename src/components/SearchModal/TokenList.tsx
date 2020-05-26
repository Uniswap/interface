import { ChainId, JSBI, Token, TokenAmount } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Circle from '../../assets/images/circle.svg'
import { ALL_TOKENS } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks'
import { Link as StyledLink, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import { ButtonSecondary } from '../Button'
import Column, { AutoColumn } from '../Column'
import { RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { FadedSpan, GreySpan, MenuItem, SpinnerWrapper, ModalInfo } from './styleds'

function isDefaultToken(tokenAddress: string, chainId?: number): boolean {
  const address = isAddress(tokenAddress)
  return Boolean(chainId && address && ALL_TOKENS[chainId as ChainId]?.[tokenAddress])
}

export default function TokenList({
  tokens,
  allTokenBalances,
  selectedToken,
  onTokenSelect,
  otherToken,
  showSendWithSwap,
  onRemoveAddedToken,
  otherSelectedText
}: {
  tokens: Token[]
  selectedToken: string
  allTokenBalances: { [tokenAddress: string]: TokenAmount }
  onTokenSelect: (tokenAddress: string) => void
  onRemoveAddedToken: (chainId: number, tokenAddress: string) => void
  otherToken: string
  showSendWithSwap?: boolean
  otherSelectedText: string
}) {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  if (tokens.length === 0) {
    return <ModalInfo>{t('noToken')}</ModalInfo>
  }
  return (
    <FixedSizeList
      width="100%"
      height={500}
      itemCount={tokens.length}
      itemSize={50}
      style={{ flex: '1', minHeight: 200 }}
    >
      {({ index, style }) => {
        const { address, symbol } = tokens[index]

        const customAdded = !isDefaultToken(address, chainId)
        const balance = allTokenBalances[address]

        const zeroBalance = balance && JSBI.equal(JSBI.BigInt(0), balance.raw)

        return (
          <MenuItem
            style={style}
            key={address}
            className={`token-item-${address}`}
            onClick={() => (selectedToken && selectedToken === address ? null : onTokenSelect(address))}
            disabled={selectedToken && selectedToken === address}
            selected={otherToken === address}
          >
            <RowFixed>
              <TokenLogo address={address} size={'24px'} style={{ marginRight: '14px' }} />
              <Column>
                <Text fontWeight={500}>
                  {symbol}
                  {otherToken === address && <GreySpan> ({otherSelectedText})</GreySpan>}
                </Text>
                <FadedSpan>
                  <TYPE.main fontWeight={500}>{customAdded && 'Added by user'}</TYPE.main>
                  {customAdded && (
                    <div
                      onClick={event => {
                        event.stopPropagation()
                        onRemoveAddedToken(chainId, address)
                      }}
                    >
                      <StyledLink style={{ marginLeft: '4px', fontWeight: 400 }}>(Remove)</StyledLink>
                    </div>
                  )}
                </FadedSpan>
              </Column>
            </RowFixed>
            <AutoColumn gap="4px" justify="end">
              {balance ? (
                <Text>
                  {zeroBalance && showSendWithSwap ? (
                    <ButtonSecondary padding={'4px 8px'}>
                      <Text textAlign="center" fontWeight={500} fontSize={14} color={theme.primary1}>
                        Send With Swap
                      </Text>
                    </ButtonSecondary>
                  ) : balance ? (
                    balance.toSignificant(6)
                  ) : (
                    '-'
                  )}
                </Text>
              ) : account ? (
                <SpinnerWrapper src={Circle} alt="loader" />
              ) : (
                '-'
              )}
            </AutoColumn>
          </MenuItem>
        )
      }}
    </FixedSizeList>
  )
}
