import { UdfQuotesResponse, IQuotesProvider } from './iquotes-provider';
import { QuoteData } from '../../../charting_library/datafeed-api';

import {
	getErrorMessage,
	logMessage,
	UdfErrorResponse,
} from './helpers';
import { Requester } from './requester';

export class QuotesProvider implements IQuotesProvider {
	private readonly _datafeedUrl: string;
	private readonly _requester: Requester;

	public constructor(datafeedUrl: string, requester: Requester) {
		this._datafeedUrl = datafeedUrl;
		this._requester = requester;
	}

	public getQuotes(symbols: string[]): Promise<QuoteData[]> {
		return new Promise((resolve: (data: QuoteData[]) => void, reject: (reason: string) => void) => {
			this._requester.sendRequest<UdfQuotesResponse>(this._datafeedUrl, 'quotes', { symbols: symbols })
				.then((response: UdfQuotesResponse | UdfErrorResponse) => {
					if (response.s === 'ok') {
						resolve(response.d);
					} else {
						reject(response.errmsg);
					}
				})
				.catch((error?: string | Error) => {
					const errorMessage = getErrorMessage(error);
					logMessage(`QuotesProvider: getQuotes failed, error=${errorMessage}`);
					reject(`network error: ${errorMessage}`);
				});
		});
	}
}
