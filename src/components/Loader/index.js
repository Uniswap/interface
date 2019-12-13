import React from 'react'
import styled, { keyframes } from 'styled-components'
import PropTypes from 'prop-types'
import Circle from '../../assets/images/circle-grey.svg'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.img`
  animation: 2s ${rotate} linear infinite;
  width: 16px;
  height: 16px;
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
  color: ${({ theme }) => theme.chaliceGray};
`

export const LoaderStyled = styled.div.attrs(({ theme, variant }) => ({}))``

function Loader({ children, variant, pink, ...rest }) {
  return <SpinnerWrapper src={Circle} alt="loader" />
}

Loader.propTypes = {
  variant: PropTypes.oneOf(['default', 'blue'])
}

Loader.defaultProps = {
  variant: 'default'
}

export default Loader
