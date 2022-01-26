import React from 'react';
export declare enum FlyoutAlignment {
    LEFT = "LEFT",
    RIGHT = "RIGHT"
}
export default function Menu(): JSX.Element;
interface NewMenuProps {
    flyoutAlignment?: FlyoutAlignment;
    ToggleUI?: React.FunctionComponent;
    menuItems: {
        content: any;
        link: string;
        external: boolean;
    }[];
}
export declare const NewMenu: ({ flyoutAlignment, ToggleUI, menuItems, ...rest }: NewMenuProps) => JSX.Element;
export {};
