import { SupportedLocale } from 'constants/locales';
import { Theme } from 'lib/theme';
import { PropsWithChildren } from 'react';
import { Provider as EthProvider } from 'widgets-web3-react/types';
import { ErrorHandler } from './Error/ErrorBoundary';
export declare type WidgetProps = {
    theme?: Theme;
    locale?: SupportedLocale;
    provider?: EthProvider;
    jsonRpcEndpoint?: string;
    width?: string | number;
    dialog?: HTMLElement | null;
    className?: string;
    onError?: ErrorHandler;
};
export default function Widget(props: PropsWithChildren<WidgetProps>): JSX.Element;
