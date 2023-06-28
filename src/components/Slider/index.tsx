import { ChangeEvent, useCallback } from 'react'
import styled from 'styled-components/macro'

const StyledRangeInput = styled.input<{ size: number }>`
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &::-moz-focus-outer {
    border: 0;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: ${({ size }) => size}px;
    width: ${({ size }) => size}px;
    background-color: ${({ theme }) => theme.white};
    border-radius: 100%;
    border: none;
    transform: translateY(-50%);
    box-shadow: ${({ theme }) => theme.deepShadow};

    &:hover,
    &:focus {
      box-shadow: ${({ theme }) => theme.deepShadow};
    }
  }

  &::-moz-range-thumb {
    height: ${({ size }) => size}px;
    width: ${({ size }) => size}px;
    border-radius: 100%;
    border: none;

    &:hover,
    &:focus {
      box-shadow: ${({ theme }) => theme.deepShadow};
    }
  }

  &::-ms-thumb {
    height: ${({ size }) => size}px;
    width: ${({ size }) => size}px;
    border-radius: 100%;

    &:hover,
    &:focus {
      box-shadow: ${({ theme }) => theme.deepShadow};
    }
  }

  &::-webkit-slider-runnable-track {
    background: ${({ theme }) => theme.rainbowPegasysGradient};
    height: 2px;
  }

  &::-moz-range-track {
    background: ${({ theme }) => theme.rainbowPegasysGradient};
    height: 2px;
  }

  &::-ms-track {
    width: 100%;
    border-color: transparent;
    color: transparent;

    background: ${({ theme }) => theme.rainbowPegasysGradient};
    height: 2px;
  }
  &::-ms-fill-lower {
    background: ${({ theme }) => theme.rainbowPegasysGradient};
  }
  &::-ms-fill-upper {
    background: ${({ theme }) => theme.rainbowPegasysGradient};
  }
`

interface InputSliderProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  size?: number
}

export default function Slider({
  value,
  onChange,
  min = 0,
  step = 1,
  max = 100,
  size = 28,
  ...rest
}: InputSliderProps) {
  const changeCallback = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value))
    },
    [onChange]
  )

  return (
    <StyledRangeInput
      size={size}
      {...rest}
      type="range"
      value={value}
      style={{ padding: '15px 0' }}
      onChange={changeCallback}
      aria-labelledby="input slider"
      step={step}
      min={min}
      max={max}
    />
  )
}
