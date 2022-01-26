/// <reference types="react" />
import { AbstractConnector } from '@web3-react/abstract-connector';
export default function PendingView({ connector, error, setPendingError, tryActivation, }: {
    connector?: AbstractConnector;
    error?: boolean;
    setPendingError: (error: boolean) => void;
    tryActivation: (connector: AbstractConnector) => void;
}): JSX.Element;
