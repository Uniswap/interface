import React from 'react'
import { Text } from 'rebass'
import { ButtonProps } from 'rebass/styled-components'
import { ButtonPrimary } from '../Button/index'
import styled from 'styled-components'
import { ROUTABLE_PLATFORM_STYLE } from '../../constants'

const SwapButtonStyled = styled(ButtonPrimary)<{ bgImage: string }>`
  background-image: ${({ bgImage, disabled }) => !disabled && bgImage};
`

const PlataformImageStyled = styled.img`
  margin-top: -3px;
  margin-right: 6px;
`

const SwapButtonText = styled(Text)`
  display: flex;
  height: 16px;
  white-space: pre-wrap;
`

const PlataformText = styled(Text)`
  text-transform: none;
`

interface SwapButtonProps {
  platformName?: string
  swapInputError?: string
  priceImpactSeverity: number
  isExpertMode: boolean
}

export const SwapButton = ({
  platformName,
  swapInputError,
  priceImpactSeverity,
  isExpertMode,
  ...rest
}: SwapButtonProps & ButtonProps) => {
  return (
    <SwapButtonStyled bgImage={platformName && ROUTABLE_PLATFORM_STYLE[platformName].bgImage} {...rest}>
      <SwapButtonText>
        {swapInputError ? (
          swapInputError
        ) : priceImpactSeverity > 3 && !isExpertMode ? (
          `Price Impact Too High`
        ) : (
          <>
            Swap with
            {platformName && (
              <>
                {' '}
                <PlataformImageStyled
                  width={21}
                  height={21}
                  src={ROUTABLE_PLATFORM_STYLE[platformName].logo}
                  alt={ROUTABLE_PLATFORM_STYLE[platformName].alt}
                />
                <PlataformText>{platformName}</PlataformText>
              </>
            )}
            {priceImpactSeverity > 2 ? ' Anyway' : ''}
          </>
        )}
      </SwapButtonText>
    </SwapButtonStyled>
  )
}
