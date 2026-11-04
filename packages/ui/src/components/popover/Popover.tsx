import type {
  PopoverAdaptContentsProps,
  PopoverAdaptProps,
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverImperativeHandle,
  PopoverProps,
  PopoverTriggerProps,
} from 'ui/src/components/popover/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

function PopoverStub(_props: PopoverProps): JSX.Element {
  throw new PlatformSplitStubError('Popover')
}

const AdaptStub = Object.assign(
  (_props: PopoverAdaptProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Adapt')
  },
  {
    Contents: (_props: PopoverAdaptContentsProps): JSX.Element => {
      throw new PlatformSplitStubError('Popover.Adapt.Contents')
    },
  },
)

/**
 * TODO(INFRA-4485): Move the remaining consumers to `PopoverCompat`, then delete this.
 *
 * @deprecated Use `PopoverCompat` from `@universe/mycelium/popover-compat` instead.
 */
export const Popover = Object.assign(PopoverStub, {
  Trigger: (_props: PopoverTriggerProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Trigger')
  },
  Anchor: (_props: PopoverAnchorProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Anchor')
  },
  Content: (_props: PopoverContentProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Content')
  },
  Close: (_props: PopoverCloseProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Close')
  },
  Arrow: (_props: PopoverArrowProps): JSX.Element => {
    throw new PlatformSplitStubError('Popover.Arrow')
  },
  Adapt: AdaptStub,
})

/**
 * Legacy type/value merge: `useRef<Popover>` at call sites resolves to the
 * imperative handle (`anchorTo`/`toggle`/`open`/`close`/`setOpen`).
 */
export type Popover = PopoverImperativeHandle
