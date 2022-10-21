export const primaryButtonVariants = {
  defaults: {
    backgroundColor: 'accentAction',
    color: 'white',
  },
  black: {
    backgroundColor: 'black',
    color: 'white',
    borderRadius: 'md',
  },
  gray: {
    backgroundColor: 'background3',
    color: 'textPrimary',
  },
  green: {
    backgroundColor: 'accentSuccess',
    color: 'white',
  },
  palePink: {
    backgroundColor: 'accentActionSoft',
    color: 'white',
  },
  paleOrange: {
    backgroundColor: 'accentCriticalSoft',
    color: 'accentCritical',
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
    backgroundColor: 'accentActive',
    color: 'white',
  },
  yellow: {
    backgroundColor: 'accentWarning',
    color: 'white',
  },
  // used in full screen onboarding views
  onboard: {
    py: 'md',
    backgroundColor: 'accentActive',
  },
  warning: {
    backgroundColor: 'accentWarningSoft',
    color: 'accentWarning',
  },
  failure: {
    backgroundColor: 'accentCriticalSoft',
    color: 'accentCritical',
  },
  warningDark: {
    backgroundColor: 'accentCritical',
    color: 'textOnDimPrimary',
  },
}

export const iconButtonVariants = {
  defaults: {},
  primary: {
    alignSelf: 'center',
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
