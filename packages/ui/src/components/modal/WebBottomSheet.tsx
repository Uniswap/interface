import type { ModalProps } from 'ui/src/components/modal/AdaptiveWebModalShared'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Platform-split base stub. The real sheet lives in `WebBottomSheet.web.tsx` and is imported only
 * from the `.web` legs of the AdaptiveWebModal cluster (always via the explicit `.web` specifier),
 * so nothing should ever resolve this file — it throws to make an accidental off-web import loud.
 * The native-reachable `WebBottomSheet` consumers see through the barrel is the render-nothing
 * export in `AdaptiveWebModal.native.tsx` (native bottom sheets are gorhom-based via
 * `uniswap/src/components/modals/Modal.native.tsx`).
 *
 * TODO(INFRA-4485): Move the remaining consumers to mycelium's `WebBottomSheet`, then delete this.
 *
 * @deprecated Use `WebBottomSheet` from `@universe/mycelium` instead.
 */
export function WebBottomSheet(_props: ModalProps): JSX.Element | null {
  throw new PlatformSplitStubError('WebBottomSheet')
}
