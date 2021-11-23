import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { ChangeEvent, RefObject, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, ChevronDown, HelpCircle, Info } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components/macro'

import AddressInputPanel from '../../components/AddressInputPanel'
import {
  BaseButton,
  ButtonConfirmed,
  ButtonError,
  ButtonGray,
  ButtonLight,
  ButtonPrimary,
  ButtonSecondary,
} from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import FaucetAddressInputPanel from '../../components/faucet/FaucetAddressInputPanel'
import FaucetDropDown from '../../components/faucet/FaucetDropDown'
import { FlyoutAlignment, NewMenu } from '../../components/Menu'
import RangeSelector from '../../components/RangeSelector'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { SearchInput } from '../../components/SearchModal/styleds'
import { useActiveWeb3React } from '../../hooks/web3'
import { useDefaultsFromURLSearch } from '../../state/swap/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'

const StyledInfo = styled(Info)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
export const Wrapper = styled.div`
  display: flex;
  position: relative;
  padding: 8px;
  max-width: 870px;
  width: 100%;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 500px;
  `};
`
// const Menu = styled(NewMenu)`
//   margin-left: 0;
//   ${({ theme }) => theme.mediaWidth.upToSmall`
//     flex: 1 1 auto;
//     width: 49%;
//     right: 0px;
//   `};
//
//   a {
//     width: 100%;
//   }
// `
// const MoreOptionsButton = styled(ButtonGray)`
//   border-radius: 12px;
//   flex: 1 1 auto;
//   padding: 6px 8px;
//   width: 100%;
//   background-color: ${({ theme }) => theme.bg0};
//   margin-right: 8px;
// `

const FormWrapper = styled.div`
  width: 100%;
  position: relative;
  //flex: 1;
  background: ${({ theme }) => theme.bg0};
  padding: 1rem;
  border-radius: 1.25rem;
`

const Form = styled.form`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg0};
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px;
`

const SelectWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
  height: 100%;
  padding-left: 8px;
  padding-right: 8px;
`

const Select = styled.select`
  width: 100%;
  background-color: ${({ theme }) => theme.bg1};
  border: none;
`

const Input = styled.input`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.bg1};
  transition: color 300ms;
  color: ${({ theme }) => theme.text1};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

export default function Faucet({ history }: RouteComponentProps) {
  const { account } = useActiveWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()

  const [walletAddress, setWalletAddress] = useState('')
  const [selectToken, setselectToken] = useState('ETH')

  // const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setValue(event.target.value)
  // }

  const handleChange = (val: string) => {
    setWalletAddress(val)
  }

  // const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
  //   setselectToken(event.target.value)
  // }

  // const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
  //   console.log('Faucet claim request send!')
  // }

  return (
    <>
      <Wrapper>
        <ColumnCenter style={{ justifyContent: 'center' }}>
          <TitleRow style={{ marginTop: '1rem', justifyContent: 'center', marginBottom: '2rem' }} padding={'0'}>
            <TYPE.body fontSize={'20px'} style={{ justifyContent: 'center' }}>
              <Trans>UZH Ethereum Faucet</Trans>
            </TYPE.body>
          </TitleRow>
          <FormWrapper>
            <Form>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '30%', gap: '8px' }}>
                  <div>
                    <Trans>Select Token</Trans>
                  </div>
                  <FaucetDropDown />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '70%', gap: '8px' }}>
                  <Trans>Enter your account address</Trans>
                  <FaucetAddressInputPanel value={walletAddress} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'flex', width: '100%', gap: '30px', alignItems: 'center' }}>
                <ButtonSecondary style={{ width: '30%', height: '60%' }}> Send request! </ButtonSecondary>
                <div style={{ width: '70%' }}>
                  <Trans>How it works</Trans>
                  <p>
                    You can send a faucet request every 60 seconds. To do so, you need to provide a valid account
                    address
                  </p>
                </div>
              </div>
            </Form>
          </FormWrapper>
        </ColumnCenter>
      </Wrapper>
    </>
  )
}
