import { QuoteData } from '../../../charting_library/datafeed-api';

import {
	UdfOkResponse,
} from './helpers';

export interface UdfQuotesResponse extends UdfOkResponse {
	d: QuoteData[];
}

export interface IQuotesProvider {
	// tslint:disable-next-line:variable-name tv-variable-name
	getQuotes(symbols: string[]): Promise<QuoteData[]>;
}
