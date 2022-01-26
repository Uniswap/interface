import React from 'react';
export default function Option({ link, clickable, size, onClick, color, header, subheader, icon, active, id, }: {
    link?: string | null;
    clickable?: boolean;
    size?: number | null;
    onClick?: null | (() => void);
    color: string;
    header: React.ReactNode;
    subheader: React.ReactNode | null;
    icon: string;
    active?: boolean;
    id: string;
}): JSX.Element;
