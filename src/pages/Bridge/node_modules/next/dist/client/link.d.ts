/// <reference types="node" />
import React from 'react';
import { UrlObject } from 'url';
declare type Url = string | UrlObject;
declare type InternalLinkProps = {
    href: Url;
    as?: Url;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
    /**
     * requires experimental.newNextLinkBehavior
     */
    onMouseEnter?: (e: any) => void;
    /**
     * requires experimental.newNextLinkBehavior
     */
    onTouchStart?: (e: any) => void;
    /**
     * requires experimental.newNextLinkBehavior
     */
    onClick?: (e: any) => void;
};
export declare type LinkProps = InternalLinkProps;
declare const Link: React.ForwardRefExoticComponent<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof InternalLinkProps> & InternalLinkProps & {
    children?: React.ReactNode;
} & React.RefAttributes<HTMLAnchorElement>>;
export default Link;
