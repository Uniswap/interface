import React from 'react'
import Slider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'

const StyledSlider = withStyles({
  root: {
    width: '90%',
    color: '#565A69',
    height: 4,
    marginLeft: '15px',
    marginRight: '15px',
    padding: '15px 0'
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '#565A69',
    marginTop: -14,
    marginLeft: -14,
    '&:focus,&:hover,&$active': {
      boxShadow:
        '0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.04)',
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {}
    }
  },
  active: {},
  track: {
    height: 4
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#C3C5CB'
  },
  mark: {
    backgroundColor: '#C3C5CB',
    height: 12,
    width: 2,
    marginTop: -4
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
    height: 12,
    width: 2,
    marginTop: -4
  }
})(Slider)

interface InputSliderProps {
  value: number
  onChange: (value: number) => void
}

export default function InputSlider({ value, onChange }: InputSliderProps) {
  function wrappedOnChange(_, value) {
    onChange(value)
  }
  return <StyledSlider value={value} onChange={wrappedOnChange} aria-labelledby="input-slider" step={1} />
}
