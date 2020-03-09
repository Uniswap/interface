import React from 'react'
import Slider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'

const IOSSlider = withStyles({
  root: {
    width: '95%',
    color: '#3880ff',
    height: 4,
    marginLeft: '15px',
    padding: '15px 0'
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '##2172E5',
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
    backgroundColor: '#bfbfbf'
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 1,
    marginTop: -3
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor'
  }
})(Slider)

export default function InputSlider({ value, onChange }) {
  return <IOSSlider value={typeof value === 'number' ? value : 0} onChange={onChange} aria-labelledby="input-slider" />
}
