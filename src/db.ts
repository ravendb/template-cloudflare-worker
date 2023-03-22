import { SessionOptions } from 'ravendb';
import { DocumentStore } from 'ravendb';

let store: DocumentStore;
let initialized = false;

interface InitializeOptions {
	urls: string[];
	databaseName: string;
	fetchBinding?: { fetch: typeof fetch };
}

export async function initializeDb({ urls, databaseName, fetchBinding }: InitializeOptions) {
	if (initialized) return store;

	store = new DocumentStore(urls, databaseName);

	// Support for Cloudflare mTLS bindings
	if (fetchBinding) {
		console.info('A bound cert was found and will be used for RavenDB requests.');
		store.conventions.customFetch = fetchBinding.fetch.bind(fetchBinding);
	}

	store.initialize();

	initialized = true;

	return store;
}

export function openDbSession(opts?: SessionOptions) {
	if (!initialized)
		throw new Error(
			'DocumentStore is not initialized yet. Must `initializeDb()` before calling `openDbSession()`.'
		);
	if (opts) {
		return store.openSession(opts);
	}
	return store.openSession();
}
