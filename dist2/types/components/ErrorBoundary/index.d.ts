import React, { ErrorInfo } from 'react';
declare type ErrorBoundaryState = {
    error: Error | null;
};
export default class ErrorBoundary extends React.Component<unknown, ErrorBoundaryState> {
    constructor(props: unknown);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): React.ReactNode;
}
export {};
