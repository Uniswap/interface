import React from 'react'
import { Text } from 'rebass'
import { ButtonProps } from 'rebass/styled-components'
import { ButtonPrimary } from '../Button/index'
import styled from 'styled-components'
import { ROUTABLE_PLATFORM_STYLE } from '../../constants'
import { PRICE_IMPACT_HIGH, PRICE_IMPACT_MEDIUM } from '../../utils/prices'
import { useTranslation } from 'react-i18next'

const StyledSwapButton = styled(ButtonPrimary)<{ bgImage: string }>`
  background-image: ${({ bgImage, disabled }) => !disabled && bgImage};
`

const StyledPlataformImage = styled.img`
  margin-top: -3px;
  margin-right: 6px;
`

const StyledSwapButtonText = styled(Text)`
  display: flex;
  height: 16px;
  white-space: pre-wrap;
`

const StyledPlataformText = styled(Text)`
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
  const { t } = useTranslation()

  return (
    <StyledSwapButton bgImage={platformName && ROUTABLE_PLATFORM_STYLE[platformName].bgImage} {...rest}>
      <StyledSwapButtonText>
        {swapInputError ? (
          swapInputError
        ) : priceImpactSeverity > PRICE_IMPACT_HIGH && !isExpertMode ? (
          t('priceImpactTooHigh')
        ) : (
          <>
            {t('swapWith')}
            {platformName && (
              <>
                {' '}
                <StyledPlataformImage
                  width={21}
                  height={21}
                  src={ROUTABLE_PLATFORM_STYLE[platformName].logo}
                  alt={ROUTABLE_PLATFORM_STYLE[platformName].alt}
                />
                <StyledPlataformText>{platformName}</StyledPlataformText>
              </>
            )}
            {priceImpactSeverity > PRICE_IMPACT_MEDIUM ? ` ${t('anyway')}` : ''}
          </>
        )}
      </StyledSwapButtonText>
    </StyledSwapButton>
  )
}
