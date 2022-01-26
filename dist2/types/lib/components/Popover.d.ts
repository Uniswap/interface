import { Placement } from '@popperjs/core';
import React from 'react';
export declare const BoundaryProvider: React.Provider<HTMLDivElement | null>;
export interface PopoverProps {
    content: React.ReactNode;
    show: boolean;
    children: React.ReactNode;
    placement: Placement;
    contained?: true;
}
export default function Popover({ content, show, children, placement, contained }: PopoverProps): JSX.Element;
