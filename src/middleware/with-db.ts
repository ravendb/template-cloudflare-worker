import { IRequest } from 'itty-router';

import { bindFetcherToStore, initializeDb } from '../db';
import { Env } from '../types';

export const withDb = (request: IRequest, env: Env) => {
	if (!env.DB_NAME) {
		return new Response(
			'It looks like your worker is not yet set up to connect to a RavenDB database. Follow the setup instructions in the README to get started!'
		);
	}

	const dbStore = initializeDb(env.DB_URLS.split(','), env.DB_NAME);

	if (env.DB_CERT?.fetch) {
		console.info('A bound cert was found and will be used for RavenDB requests.');
		bindFetcherToStore(env.DB_CERT.fetch.bind(env.DB_CERT), dbStore);
	}

	const dbSession = dbStore.openSession();
	env.db = dbSession;
};
