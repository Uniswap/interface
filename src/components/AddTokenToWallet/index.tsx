import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { RowFixed } from 'components/Row'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { CheckCircle } from 'react-feather'
import styled from 'styled-components/macro'

import METAMASK_ICON_URL from '../../assets/images/metamask.png'

interface Props {
  token: Token
}
const StyledTokenToWallet = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  color: ${({ theme }) => theme.text2};
`

const AddTokenToWallet = (props: Props) => {
  const { addToken, success } = useAddTokenToMetamask(props.token)

  return (
    <StyledTokenToWallet>
      {!success ? (
        <RowFixed style={{ cursor: 'pointer' }} onClick={() => addToken()}>
          <Trans>
            Add {props.token.symbol} to Metamask{' '}
            <img width={15} height={15} src={METAMASK_ICON_URL} style={{ marginLeft: '6px' }} alt="metamask_icon" />
          </Trans>
        </RowFixed>
      ) : (
        <RowFixed>
          <Trans>Added {props.token.symbol} </Trans>
          <CheckCircle size={'15px'} stroke={'#27AE60'} style={{ marginLeft: '6px' }} />
        </RowFixed>
      )}
    </StyledTokenToWallet>
  )
}

export default AddTokenToWallet
