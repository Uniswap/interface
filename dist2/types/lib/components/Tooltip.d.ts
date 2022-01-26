import { Placement } from '@popperjs/core';
import { Icon } from 'lib/icons';
import { ReactNode } from 'react';
interface TooltipInterface {
    icon?: Icon;
    children: ReactNode;
    placement: Placement;
    contained?: true;
}
export default function Tooltip({ icon: Icon, children, placement, contained, }: TooltipInterface): JSX.Element;
export {};
