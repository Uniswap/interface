import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useCallback, useEffect, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Moon, Power, Sun } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useNativeCurrencyBalances } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'

import { themeVars } from '../../css/sprinkles.css'
import useENS from '../../hooks/useENS'
import { useUserUnclaimedAmount } from '../../state/claim/hooks'
import { shortenAddress } from '../../utils'
import { Currency, fetchPrice } from '../../utils/fetchPrice'
import { ButtonPrimary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'

export enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const UNIbutton = styled(ButtonPrimary)`
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
  margin-top: 32px;
  border-radius: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-top: 20px;
`

const WalletWrapper = styled.div`
  border-radius: 12px;
  min-width: 278px;
  max-height: 407px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
`

const LanguageWrapper = styled.div`
  border-radius: 12px;
  min-width: 278px;
  max-height: 371px;
  display: flex;
  flex-direction: column;
  font-size: 16px;

  &::-webkit-scrollbar {
    display: none;
  }
`

const IconContainer = styled.div`
  display: inline-block;
  float: right;

  & > div {
    margin-right: 8px;
  }

  & > div:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const Divider = styled.div`
  border: 1px solid rgba(153, 161, 189, 0.24);
  margin-top: 20px;
  margin-bottom: 20px;
`
const InternalMenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const ToggleMenuItem = styled.button`
  background-color: transparent;
  margin: 0;
  border: none;
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 8px 0px;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 500;
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  justify-content: space-between;
  text-decoration: none;
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

const LanguageBack = styled.span`
  padding: 8px 16px;
  cursor: pointer;
  color: ${themeVars.colors.darkGray};
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

// TODO: add back in when we have a profile component
// const ViewProfileButton = styled(ButtonPrimary)`
//   border-radius: 8px;
//   margin-top: 32px;
//   margin-bottom: 12px;
//   padding-top: 12px;
//   padding-bottom: 12px;
// `

function LanguageMenuItem({ locale, active, key }: { locale: SupportedLocale; active: boolean; key: string }) {
  const { to, onClick } = useLocationLinkProps(locale)

  if (!to) return null

  return (
    <InternalLinkMenuItem
      style={{
        backgroundColor: active ? 'rgba(153, 161, 189, 0.08)' : '',
        color: active ? themeVars.colors.blackBlue : themeVars.colors.darkGray,
      }}
      onClick={onClick}
      key={key}
      to={to}
    >
      <Text fontWeight={500} lineHeight="24px">
        {LOCALE_LABEL[locale]}
      </Text>
      {active && <Check opacity={1} size={24} />}
    </InternalLinkMenuItem>
  )
}

function LanguageMenu({ close }: { close: () => void }) {
  const activeLocale = useActiveLocale()

  return (
    <LanguageWrapper style={{ overflowY: 'scroll' }}>
      <LanguageBack onClick={close}>
        <ChevronLeft size={24} />
      </LanguageBack>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} active={activeLocale === locale} key={locale} />
      ))}
    </LanguageWrapper>
  )
}

const Wallet = () => {
  const { account, connector } = useWeb3React()
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const [price, setPrice] = useState(1500)
  const [changeLanguage, setChangeLanguage] = useState(false)
  const [isCopied, setCopied] = useCopyClipboard()
  const balanceString = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']?.toSignificant(3) ?? ''
  const activeLocale = useActiveLocale()
  const ISO = activeLocale.split('-')[0].toUpperCase()
  const countryCode = activeLocale.split('-')[1].toUpperCase()
  const dispatch = useAppDispatch()
  const connectionType = getConnection(connector).type

  const { address: parsedAddress } = useENS(account)
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(parsedAddress)
  const { symbol } = useNativeCurrency()
  const noTokensAvailable = parseFloat(unclaimedAmount?.toFixed(4) || '0') === 0
  const claimsText = noTokensAvailable
    ? 'No rewards to claim'
    : `Claim ${unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')}`

  const copy = useCallback(() => {
    setCopied(account || '')
  }, [account, setCopied])

  useEffect(() => {
    fetchPrice(symbol as Currency).then((price = 0) => {
      setPrice(price)
    })
  }, [symbol])

  return (
    <>
      {changeLanguage ? (
        <LanguageMenu close={() => setChangeLanguage(false)} />
      ) : (
        <WalletWrapper>
          <div>
            <div>
              <div style={{ display: 'inline-block', marginTop: 7 }}>
                <div style={{ display: 'flex' }}>
                  <StatusIcon connectionType={connectionType} />
                  <Text fontSize={16} fontWeight={500}>
                    {account && shortenAddress(account, 4)}
                  </Text>
                </div>
              </div>

              <IconContainer>
                <IconButton onClick={copy} Icon={Copy} text={isCopied ? 'Copied!' : 'Copy'} />
                <IconButton
                  onClick={() => window.open(`https://etherscan.io/address/${account}`, '_blank')}
                  Icon={ExternalLink}
                  text="Etherscan"
                />
                <IconButton
                  onClick={() => {
                    if (connector && connector.deactivate) {
                      connector.deactivate()
                    }
                    connector.resetState()
                    dispatch(updateSelectedWallet({ wallet: undefined }))
                  }}
                  Icon={Power}
                  text="Disconnect"
                />
              </IconContainer>
            </div>
          </div>
          <Column>
            <Text fontSize={24} fontWeight={600} marginTop="8px" marginBottom="8px">
              {`${balanceString} ${symbol}`}
            </Text>
            <Text fontSize={14} fontWeight={500} color={themeVars.colors.placeholder}>
              ${(price * parseFloat(balanceString || '0')).toFixed(2)} USD
            </Text>
            {/* TODO: add this back in when we have a profile component  */}
            {/* <ViewProfileButton>View Profile</ViewProfileButton> */}
            <UNIbutton style={{ border: 'none' }} disabled={noTokensAvailable}>
              <Text color="white">{claimsText}</Text>
            </UNIbutton>
          </Column>
          <Divider />
          <ToggleMenuItem onClick={() => setChangeLanguage(true)}>
            <Text color={themeVars.colors.darkGray}>
              <Trans>Language</Trans>
            </Text>

            <span style={{ display: 'flex', color: themeVars.colors.blackBlue }}>
              <ReactCountryFlag style={{ marginTop: 4, marginRight: 5 }} countryCode={countryCode} />
              <span style={{ marginTop: 1 }}>{ISO}</span>

              <span style={{ marginTop: 2, marginLeft: 15 }}>
                <ChevronRight color={themeVars.colors.blackBlue} size={20} />
              </span>
            </span>
          </ToggleMenuItem>
          <ToggleMenuItem onClick={() => toggleDarkMode()}>
            <>
              <Text color={themeVars.colors.darkGray}>
                <Trans>{darkMode ? 'Light Theme' : 'Dark Theme'}</Trans>
              </Text>
              {darkMode ? (
                <Sun color={themeVars.colors.blackBlue} size={20} />
              ) : (
                <Moon color={themeVars.colors.blackBlue} size={20} />
              )}
            </>
          </ToggleMenuItem>
        </WalletWrapper>
      )}
    </>
  )
}

export default Wallet
