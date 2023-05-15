import { UDFCompatibleDatafeedBase } from './udf-compatible-datafeed-base';
import { QuotesProvider } from './quotes-provider';
import { Requester } from './requester';
import { type LimitedResponseConfiguration } from './history-provider';

export class UDFCompatibleDatafeed extends UDFCompatibleDatafeedBase {
	public constructor(
		datafeedURL: string,
		updateFrequency: number = 10 * 1000,
		limitedServerResponse?: LimitedResponseConfiguration
	) {
		const requester = new Requester();
		const quotesProvider = new QuotesProvider(datafeedURL, requester);
		super(datafeedURL, quotesProvider, requester, updateFrequency, limitedServerResponse);
	}
}
