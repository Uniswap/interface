import React, { ErrorInfo } from 'react';
export declare type ErrorHandler = (error: Error, info: ErrorInfo) => void;
interface ErrorBoundaryProps {
    onError?: ErrorHandler;
}
declare type ErrorBoundaryState = {
    error: Error | null;
};
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): React.ReactNode;
}
export {};
