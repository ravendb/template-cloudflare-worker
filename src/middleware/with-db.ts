import { IRequest } from 'itty-router';
import { DocumentConventions, IDocumentStore } from 'ravendb';

import { initializeDb, initializeWelcomeDb } from '../db';
import { Env } from '../types';

export const withDb =
	(customize?: (c: DocumentConventions) => void) => async (request: IRequest, env: Env) => {
		const isNewSetup = !env.DB_URLS || !env.DB_NAME;
		let dbStore: IDocumentStore;

		if (isNewSetup) {
			dbStore = initializeWelcomeDb();
		} else {
			dbStore = initializeDb({
				urls: env.DB_URLS.split(','),
				databaseName: env.DB_NAME,
				mtlsBinding: env.DB_CERT,
				customize,
			});
		}

		const dbSession = dbStore.openSession();
		env.db = dbSession;
	};
