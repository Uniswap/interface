import { SupportedLocale } from 'constants/locales';
import { Theme } from 'lib/theme';
import { ComponentProps, JSXElementConstructor, PropsWithChildren } from 'react';
import { Provider as EthProvider } from 'widgets-web3-react/types';
import { ErrorHandler } from './Error/ErrorBoundary';
export declare type WidgetProps<T extends JSXElementConstructor<any> | undefined = undefined> = {
    theme?: Theme;
    locale?: SupportedLocale;
    provider?: EthProvider;
    jsonRpcEndpoint?: string;
    width?: string | number;
    dialog?: HTMLElement | null;
    className?: string;
    onError?: ErrorHandler;
} & (T extends JSXElementConstructor<any> ? ComponentProps<T> : {});
export default function Widget(props: PropsWithChildren<WidgetProps>): JSX.Element;
