import { IRequest, Router } from 'itty-router';
import { withDb } from './middleware/with-db';
import { Env } from './types';

const router = Router();

router.all('*', withDb());

router.get('/', async (request: IRequest, env: Env) => {
	const currentNode = await env.db.advanced.getCurrentSessionNode();

	return new Response(
		`Request method: ${request.method}, CF data center: ${request.cf?.colo} (${request.cf?.regionCode}), Connected to RavenDB: ${currentNode?.database} (Tag: ${currentNode?.clusterTag})`
	);
});

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
