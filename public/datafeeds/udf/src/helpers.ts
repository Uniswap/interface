export interface RequestParams {
	[paramName: string]: string | string[] | number;
}

export interface UdfResponse {
	s: string;
}

export interface UdfOkResponse extends UdfResponse {
	s: 'ok';
}

export interface UdfErrorResponse {
	s: 'error';
	errmsg: string;
}

/**
 * If you want to enable logs from datafeed set it to `true`
 */
const isLoggingEnabled = false;
export function logMessage(message: string): void {
	if (isLoggingEnabled) {
		const now = new Date();
		// tslint:disable-next-line:no-console
		console.log(`${now.toLocaleTimeString()}.${now.getMilliseconds()}> ${message}`);
	}
}

export function getErrorMessage(error: string | Error | undefined): string {
	if (error === undefined) {
		return '';
	} else if (typeof error === 'string') {
		return error;
	}

	return error.message;
}
