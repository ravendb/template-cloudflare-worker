import { IRequest } from 'itty-router';

import { initializeDb } from '../db';
import { Env } from '../types';

export const withDb = async (request: IRequest, env: Env) => {
	if (!env.DB_NAME) {
		return new Response(
			'It looks like your worker is not yet set up to connect to a RavenDB database. Follow the setup instructions in the README to get started!'
		);
	}

	const dbStore = await initializeDb({
		urls: env.DB_URLS.split(','),
		databaseName: env.DB_NAME,
		fetchBinding: env.DB_CERT,
	});

	const dbSession = dbStore.openSession();
	env.db = dbSession;
};
