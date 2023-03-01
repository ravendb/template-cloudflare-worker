import { IRequest, Router } from 'itty-router';
import { withDb } from './middleware/with-db';
import { Env } from './types';

const router = Router();

router.all('*', withDb as any);

router.get('/', async (request: IRequest, env: Env) => {
	const currentNode = await env.db.advanced.getCurrentSessionNode();

	return new Response(
		`request method: ${request.method}, CF data center: ${request.cf?.colo} (${
			(request.cf as any)?.regionCode
		}), using closest db node tag: ${currentNode?.clusterTag}`
	);
});

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
