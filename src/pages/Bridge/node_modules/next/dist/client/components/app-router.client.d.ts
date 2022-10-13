import type { ReactNode } from 'react';
import type { FlightRouterState, FlightData } from '../../server/app-render';
/**
 * Fetch the flight data for the provided url. Takes in the current router state to decide what to render server-side.
 */
export declare function fetchServerResponse(url: URL, flightRouterState: FlightRouterState, prefetch?: true): Promise<[FlightData: FlightData]>;
/**
 * The global router that wraps the application components.
 */
export default function AppRouter({ initialTree, initialCanonicalUrl, children, hotReloader, }: {
    initialTree: FlightRouterState;
    initialCanonicalUrl: string;
    children: ReactNode;
    hotReloader?: ReactNode;
}): JSX.Element;
