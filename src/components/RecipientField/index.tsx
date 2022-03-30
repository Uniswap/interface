import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Flex } from 'rebass/styled-components'
import styled from 'styled-components'
import { SearchInput } from '../SearchModal/styleds'
import { RowBetween } from '../Row'
import { CloseIcon, TYPE } from '../../theme'
import useENS from '../../hooks/useENS'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

const AddRecipientButtonStyled = styled.button`
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
  color: ${({ theme }) => theme.text4};
  outline: none;
  background: transparent;
  border: none;
`
const CloseIconStyled = styled(CloseIcon)`
  padding: 0;
`

const SearchInputStyled = styled(SearchInput)<{ error: boolean }>`
  margin-top: 5px;
  font-size: 14px;
  font-weight: 500;
  padding: ${({ error }) => error && '15px 19px'};
  && {
    border: ${({ error }) => error && 'solid 1px red'};
  }
`

interface RecipientField {
  recipient: string | null
  action: any
}

export const RecipientField = ({ recipient, action }: RecipientField) => {
  const { t } = useTranslation()
  const [showInput, setShowInput] = useState(false)
  const dispatch = useDispatch()
  const { address, loading } = useENS(recipient)
  const error = useMemo(() => Boolean(recipient && recipient.length > 0 && !loading && !address), [
    address,
    loading,
    recipient
  ])

  const handleInput = useCallback(
    event => {
      const input = event.target.value
      dispatch(action({ recipient: input }))
    },
    [action, dispatch]
  )

  // Unset recipient on unmount
  useEffect(() => {
    return () => {
      dispatch(action({ recipient: null }))
    }
  }, [action, dispatch])

  const handleClose = useCallback(() => {
    setShowInput(false)
    dispatch(action({ recipient: null }))
  }, [action, dispatch])

  return !showInput ? (
    <Flex justifyContent="center">
      <AddRecipientButtonStyled onClick={() => setShowInput(true)}>{t('addRecipient')}</AddRecipientButtonStyled>
    </Flex>
  ) : (
    <div>
      <RowBetween>
        <TYPE.subHeader lineHeight={'11px'} color={'purple3'}>
          {t('recipient')}
        </TYPE.subHeader>
        <CloseIconStyled p={0} onClick={handleClose} />
      </RowBetween>
      <SearchInputStyled
        type="text"
        placeholder={t('addressOrENS')}
        value={(address || recipient) ?? ''}
        onChange={handleInput}
        error={error}
      />
    </div>
  )
}
