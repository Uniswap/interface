import { Button, ButtonProps } from '@universe/mycelium'
import { cn } from '@universe/mycelium/cn'

/** The amount preset pill (25% / 50% / Max); UI only, callers own what a press does. */
export function PresetPill({
  size = 'xxsmall',
  variant = 'branded',
  emphasis = 'secondary',
  fill = false,
  className,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <Button
      fill={fill}
      variant={variant}
      emphasis={emphasis}
      size={size}
      borderColor="$surface3"
      className={cn('hover:scale-[1.02]', className)}
      {...rest}
    />
  )
}
