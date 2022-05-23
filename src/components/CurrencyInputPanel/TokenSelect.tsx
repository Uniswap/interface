import { faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Token } from '@ubeswap/sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useState } from 'react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { CurrencySelect } from './CurrencySelect'

interface Props {
  onTokenSelect: (token: Token | null) => void
  token?: Token | null
}

const Aligner = styled.span`
  display: flex;
  align-items: center;
`

const CloseIcon = styled.div`
  margin-left: 12px;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 16px;
  padding: 5px 7px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  &:active {
    transform: rotate(360deg);
  }
  transition-duration: 1s;
  transition-property: transform;
`

const CloseColor = styled(Close)`
  transform: translateX(-2px);
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.75rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '16px')};
`

export default function TokenSelect(props: Props) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <>
      <Aligner>
        <CurrencySelect
          selected={!props.token}
          className="open-currency-select-button"
          onClick={() => {
            setModalOpen(true)
          }}
        >
          <Aligner>
            {props.token ? (
              <>
                <CurrencyLogo currency={props.token} size={'24px'} />
                <StyledTokenName> {props.token.symbol} </StyledTokenName>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFilter} width={'16px'} />
                <StyledTokenName>{t('Token')}</StyledTokenName>
              </>
            )}
          </Aligner>
        </CurrencySelect>
        {props.token && (
          <CloseIcon onClick={() => props.onTokenSelect(null)}>
            <CloseColor />
          </CloseIcon>
        )}
      </Aligner>

      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={handleDismissSearch}
        onCurrencySelect={props.onTokenSelect}
        selectedCurrency={props?.token}
        showCommonBases={true}
      />
    </>
  )
}
