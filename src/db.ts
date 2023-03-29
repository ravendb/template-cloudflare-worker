import { BuildNumber, DocumentConventions, GetBuildNumberOperation, SessionOptions } from 'ravendb';
import { DocumentStore } from 'ravendb';

import { IDocumentStore } from 'ravendb';

let store: DocumentStore;
let initialized = false;

interface InitializeOptions {
	/**
	 * Cluster Node URLs
	 */
	urls: string[];

	/**
	 * Default database
	 */
	databaseName: string;

	/**
	 * The Cloudflare mTLS binding with custom fetch method
	 */
	mtlsBinding?: { fetch: typeof fetch };

	/**
	 * Customize DocumentConventions of store before initialization
	 *
	 * @note `customFetch` is always handled internally
	 */
	customize?: (c: DocumentConventions) => void;
}

export function initializeDb({ urls, databaseName, mtlsBinding, customize }: InitializeOptions) {
	if (initialized) return store;

	store = new DocumentStore(urls, databaseName);

	if (customize) {
		customize(store.conventions);
	}

	if (mtlsBinding) {
		console.info('A bound cert was found and will be used for RavenDB requests.');
		store.conventions.customFetch = mtlsBinding.fetch.bind(mtlsBinding);
	} else {
		store.conventions.customFetch = fetch;
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

export function initializeWelcomeDb() {
	if (initialized) return store;
	
	store = new DocumentStore(['http://live-test.ravendb.net'], 'default');

	store.conventions.customFetch = fetch;
	store.conventions.disableTopologyUpdates = true;

	store.initialize();

	initialized = true;

	return store;
}
