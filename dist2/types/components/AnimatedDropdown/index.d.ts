/// <reference types="react" />
/**
 * @param open conditional to show content or hide
 * @returns Wrapper to smoothly hide and expand content
 */
export default function AnimatedDropdown({ open, children }: React.PropsWithChildren<{
    open: boolean;
}>): JSX.Element;
