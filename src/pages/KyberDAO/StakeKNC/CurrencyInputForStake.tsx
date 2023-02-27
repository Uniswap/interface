import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import KNC from 'assets/images/KNC.svg'
import Wallet from 'components/Icons/Wallet'
import Input from 'components/NumericalInput'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { useKNCPrice } from 'state/application/hooks'
import { getTokenLogoURL } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'

import { KNCLogoWrapper, SmallButton } from './StakeKNCComponent'

const InnerCard = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 12px 16px;
  //width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16));
`

export default function CurrencyInputForStake({
  value,
  setValue,
  tokenAddress,
  tokenName,
  disabled,
}: {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  tokenAddress: string
  tokenName: string
  disabled?: boolean
}) {
  const theme = useTheme()
  const tokenBalance = useTokenBalance(tokenAddress)
  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !value) return 0
    return (parseFloat(kncPrice) * parseFloat(value)).toFixed(2)
  }, [kncPrice, value])
  return (
    <InnerCard>
      <RowBetween>
        <AutoRow gap="2px">
          {!disabled && (
            <>
              <SmallButton
                onClick={() =>
                  setValue(getFullDisplayBalance(tokenBalance.value, tokenBalance.decimals, tokenBalance.decimals))
                }
              >
                Max
              </SmallButton>
              <SmallButton
                onClick={() =>
                  setValue(
                    getFullDisplayBalance(tokenBalance.value.div(2), tokenBalance.decimals, tokenBalance.decimals),
                  )
                }
              >
                Half
              </SmallButton>
            </>
          )}
        </AutoRow>
        <AutoRow gap="3px" justify="flex-end" color={theme.subText}>
          <Wallet />{' '}
          <Text fontSize={12}>
            {tokenBalance ? getFullDisplayBalance(tokenBalance.value, tokenBalance.decimals) : 0}
          </Text>
        </AutoRow>
      </RowBetween>
      <RowBetween>
        <Input value={value} onUserInput={setValue} disabled={disabled} />
        <span style={{ color: theme.border, fontSize: '14px', marginRight: '6px' }}>~${kncValueInUsd}</span>
        <KNCLogoWrapper>
          {getTokenLogoURL(tokenAddress, ChainId.MAINNET) !== '' ? (
            <img src={`${getTokenLogoURL(tokenAddress, ChainId.MAINNET)}`} alt="knc-logo" width="24px" height="24px" />
          ) : (
            <img src={KNC} alt="knc-logo" width="24px" height="24px" />
          )}
          {tokenName}
        </KNCLogoWrapper>
      </RowBetween>
    </InnerCard>
  )
}
