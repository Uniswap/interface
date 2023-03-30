import styled, { css } from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Input from 'components/NumericalInput'
import Select from 'components/Select'

export const Label = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 12px;
`

export const MiniLabel = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

export const Form = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 24px;
  padding: 20px 16px;
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    border-radius: 0px;
  `}
`

export const LeftColumn = styled.div`
  width: 60%;
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 16px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    padding-bottom: 16px;
  `}
`
export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 16px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    padding-left: 0;
    padding-top: 16px;
  `}
`

const shareStyleInput = css`
  height: 36px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 44px;
  font-size: 14px;
  padding: 8px 12px;
  color: ${({ theme }) => theme.text};
  flex-grow: unset;
`

export const StyledInputNumber = styled(Input)`
  ${shareStyleInput}
  width: 100px;
`

export const StyledInput = styled.textarea`
  ${shareStyleInput};
  width: 200px;
  height: fit-content;
  outline: none;
  background: transparent;
  height: 36px;
  max-height: 50px;
  resize: none;
`

export const StyledSelect = styled(Select)`
  ${shareStyleInput}
  min-width: 132px;
`

export const FormControl = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`

export const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-content: center;
  `}
`
const shareStyleBtn = css`
  width: 140px;
  height: 36px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  width: 164px;
`}
`

export const ButtonCancel = styled(ButtonOutlined)`
  ${shareStyleBtn}
`
export const ButtonSubmit = styled(ButtonPrimary)`
  ${shareStyleBtn}
  display: flex;
  gap: 4px;
`
export const ButtonConnectWallet = styled(ButtonLight)`
  width: 150px;
  height: 36px;
`
