import { Slider, styled as tamaguiStyled } from 'ui/src'

export const StyledSlider = tamaguiStyled(Slider, {
  hoverTheme: false,
  pressTheme: false,
  focusTheme: false,
  width: '100%',
  height: 24,
  justifyContent: 'center',
})

export const SliderTrack = tamaguiStyled(Slider.Track, {
  height: 4,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface1',
  position: 'relative',
  justifyContent: 'center',
})

export const SliderTrackActive = tamaguiStyled(Slider.TrackActive, {
  height: 4,
  borderRadius: '$roundedFull',
  backgroundColor: 'transparent',
})

export const SliderThumb = tamaguiStyled(Slider.Thumb, {
  hoverTheme: false,
  pressTheme: false,
  focusTheme: false,
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  cursor: 'grab',
  top: '50%',
  y: '-50%',
})

export const SliderThumbUnstyled = tamaguiStyled(Slider.Thumb, {
  unstyled: true,
  position: 'absolute',
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  cursor: 'grab',
  top: '50%',
  y: '-50%',
  outlineStyle: 'none',
  borderWidth: 0,
})
