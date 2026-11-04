import * as React from 'react'
import { cn } from '../cn'

/**
 * Web-only Tailwind input: a plain <input> with DOM props (`onChange`, `type`,
 * `className`). Use it for new web-only code.
 *
 * Cross-platform and legacy call sites use the compat `Input` from the
 * `@universe/mycelium` root (`input-compat/`) instead: it takes React Native
 * TextInput props (`onChangeText`, `keyboardType`, `secureTextEntry`) plus the
 * legacy Tamagui style props (`fontSize="$medium"`, `$md`, `focusStyle`), and
 * renders an RN TextInput on native.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-14 w-full rounded-[20px] border border-surface3 bg-surface2 px-5 py-2 text-body-2 font-basel-book text-neutral1 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-neutral2 focus:placeholder:text-neutral3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-surface3 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
