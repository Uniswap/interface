import { noop } from 'utilities/src/react/noop'

// To allow usage of `useOnMobileAppState` in shared code without repeated conditional rendering, we noop rather than err in this web implementation.
export const useOnMobileAppState = noop
