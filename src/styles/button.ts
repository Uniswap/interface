export const primaryButtonVariants = {
  defaults: {
    backgroundColor: 'deprecated_primary1',
    color: 'white',
  },
  black: {
    backgroundColor: 'black',
    color: 'white',
    borderRadius: 'md',
  },
  gray: {
    backgroundColor: 'deprecated_gray100',
    color: 'deprecated_textColor',
  },
  green: {
    backgroundColor: 'deprecated_green',
    color: 'white',
  },
  palePink: {
    backgroundColor: 'deprecated_secondary1',
    color: 'white',
  },
  paleOrange: {
    backgroundColor: 'deprecated_paleOrange',
    color: 'deprecated_orange',
  },
  transparent: {
    backgroundColor: 'none',
    borderColor: 'backgroundOutline',
    borderWidth: 1,
    color: 'textPrimary',
  },
  transparentBlue: {
    backgroundColor: 'none',
    borderColor: 'accentActive',
    borderWidth: 1,
    color: 'accentActive',
  },
  blue: {
    backgroundColor: 'deprecated_blue',
    color: 'white',
  },
  yellow: {
    backgroundColor: 'deprecated_yellow',
    color: 'white',
  },
  // used in full screen onboarding views
  onboard: {
    py: 'md',
    backgroundColor: 'accentActive',
  },
}

export const iconButtonVariants = {
  defaults: {},
  primary: {
    alignSelf: 'center',
    backgroundColor: 'iconButtonPrimaryBackground', // custom background defined in theme
    borderRadius: 'md',
    letterSpacing: 'headline',
    paddingHorizontal: 'lg',
    paddingVertical: 'md',
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  transparent: {
    backgroundColor: 'none',
  },
}
