import { JSXElementConstructor, ReactElement } from 'react';
export default function WidgetDecorator({ children, }: {
    children: ReactElement<any, string | JSXElementConstructor<any>>;
}): JSX.Element;
