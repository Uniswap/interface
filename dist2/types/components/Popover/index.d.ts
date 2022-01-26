import { Placement } from '@popperjs/core';
import React from 'react';
export interface PopoverProps {
    content: React.ReactNode;
    show: boolean;
    children: React.ReactNode;
    placement?: Placement;
}
export default function Popover({ content, show, children, placement }: PopoverProps): JSX.Element;
