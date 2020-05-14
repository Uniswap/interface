import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import xIcon from '../../assets/images/x.svg'

const Wrapper = styled.div`
  color: ${({ theme }) => theme.bg2};
  padding: 0.5rem;
  opacity: 0.6;

  :hover {
    cursor: pointer;
  }
`

export const LoaderStyled = styled.div.attrs(({ theme, variant, onClick }) => ({}))``

function CloseIcon({ children, variant, onClick, ...rest }) {
  return (
    <Wrapper
      onClick={() => {
        onClick()
      }}
      {...rest}
    >
      <img src={xIcon} alt="loader" />
    </Wrapper>
  )
}

CloseIcon.propTypes = {
  variant: PropTypes.oneOf(['default', 'blue'])
}

CloseIcon.defaultProps = {
  variant: 'default',
  onClick: () => {}
}

export default CloseIcon
