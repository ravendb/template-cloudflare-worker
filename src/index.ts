import { IRequest, Router } from 'itty-router';
import { GetBuildNumberOperation } from 'ravendb';
import { withDb } from './middleware/with-db';
import { Env } from './types';

const router = Router();

router.all('*', withDb());
router.get('/', welcomeHandler);
router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};

/**
 * Default welcome handler. Feel free to remove!
 */
async function welcomeHandler(request: IRequest, env: Env) {
	const metadata: WelcomeData = {
		database: env.DB_NAME || '(not set)',
		url: env.db.advanced.documentStore.urls[0],
		version: undefined,
		colo: request.cf?.colo,
		latitude: request.cf?.latitude,
		longitude: request.cf?.longitude,
		regionCode: request.cf?.regionCode,
		connected: true,
	};

	try {
		const { productVersion } = await env.db.advanced.documentStore.maintenance.send(
			new GetBuildNumberOperation()
		);
		metadata.version = productVersion;
	} catch (error) {
		/* Ignore when we cannot auto-create the database */
		metadata.connected = false;
		metadata.error = error as Error;
	}

	return new Response(getWelcomeTemplate(metadata), {
		status: 200,
		headers: { 'content-type': 'text/html' },
	});
}

interface WelcomeData {
	colo?: string;
	regionCode?: string;
	version?: string;
	url?: string;
	database?: string;
	latitude?: string;
	longitude?: string;
	connected: boolean;
	error?: Error;
}

function getWelcomeTemplate(data: WelcomeData) {
	return `<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Successfully Connected to RavenDB</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://i.icomoon.io/public/temp/1011d3eda2/UntitledProject/style.css">
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
	<style type="text/css">
	:root {
		--bs-body-bg: #181826;
		--bs-primary: #5186ee;
		--bs-link-color: #c072ee;
		--bs-card-bg: #1e1f2b;
		--bs-card-cap-bg: #262936;
		--text-color: #c3c3cf;
    --text-muted: #acadbf;
    --text-emphasis: #f0f1f6;
    --border-color-light: #424554;
    --panel-header-bg: #262936;
    --panel-bg-1: #1e1f2b;
    --panel-bg-2: #262936;
    --panel-bg-3: #353742;
    --well-bg: #181826;
		--bs-root-font-size: 14px;
	}
	body {
		font-family: Figtree,Arial, Helvetica, sans-serif;
		background: var(--bs-body-bg);
		color: var(--text-color);
		font-size: var(--bs-root-font-size);
		margin: 2rem;
		display: flex;
		align-items: center;
	}
	strong, b {
		font-weight: bolder;
		font-weight: 600;
	}
	.background {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
	}
	.background .stroke {
		stroke: #2fb7d2;
		stroke-width: 0.9758px;
		stroke-linecap: round;
    stroke-linejoin: round;
    fill: transparent;
    opacity: .4;
	}

	.icon {
    position: relative;
    width: 1em;
    height: 1em;
    display: inline-block;
    line-height: 70%;
    text-transform: none;
    vertical-align: -0.175em;
  }

	[class*=" icon-"],
	[class^="icon-"] {
		display: inline-block;
		width: 1em;
		height: 1em;
		stroke-width: 0;
		stroke: currentColor;
		fill: currentColor;
	}

	.icon-addon {
		bottom: -5%;
		width: 50%;
		height: 50%;
		line-height: 50%;
		position: absolute;
		right: -10%;
	}

	.icon-addon-clip {
		clip-path: polygon(
			0 0,
			100% 0,
			100% 59%,
			95.5% 54.5%,
			88% 50.3%,
			80% 48.5%,
			71% 49.2%,
			64% 52%,
			58% 56%,
			53% 62%,
			50% 69%,
			48.8% 79%,
			50.5% 87%,
			55% 95%,
			60% 100%,
			0 100%
		);
	}

	.icon-database {
		color: var(--bs-primary);
	}
	.icon-cloud {
		color: #ED8329;
	}

	.btn-primary {
			background-color: var(--bs-primary);
			border-color: var(--bs-primary);
	}
	.btn-primary:hover {
			background-color: var(--bs-link-color);
			border-color: var(--bs-link-color);
	}

	.illustration {
		min-height: 180px;
		text-align: center;
	}
	.illustration i {
		font-size: 128px;
	}
	

	.card {
		background-color: var(--bs-card-bg);
	}
	.card-header {
		background-color: var(--bs-card-cap-bg);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.card-header .h5 {
		margin-bottom: 0;
	}
	.card-header .h5 i {
		margin-right: 0.25rem;
	}
	.card-header i:after {
		color: var(--bs-light);
	}
	.card-body {
		padding: 1em;
	}

	dt {
		color: var(--text-muted);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-align: right;
	}
	dd {
		padding-left: 1em;
	}

	.connection-diagram {
		display: flex;
		align-items: center;
	}

	.connect {
		border-top: 4px dotted var(--bs-light);
		flex: 1;
	}

	.connector {
		padding: 0.5rem;
		flex: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.connector .connection-status {
		border-radius: 999em;
		width: 32px;
		height: 32px;
	}
	.connector .connection-status.connected {
		background: var(--bs-success);
	}
	.connector .connection-status.error {
		background: var(--bs-danger);
	}
	.connection-info {
		color: var(--bs-success);
		font-size: 1rem;
		text-transform: uppercase;
	}
	.connection-info.success {
		color: var(--bs-success);
	}
	.connection-info.error {
		color: var(--bs-danger);
	}

	.next-steps, .error-info {
		margin-top: 3rem;
	}

	pre {
		background: var(--bs-body-bg);
		padding: 1rem;
	}
	</style>
</head>
<body>
	<!-- Icons -->
	<svg
	style="position: absolute; width: 0; height: 0; overflow: hidden"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	>
	<defs>
		<symbol id="icon-cog" viewBox="0 0 32 32">
			<path d="M29.181 19.070c-1.679-2.908-0.669-6.634 2.255-8.328l-3.145-5.447c-0.898 0.527-1.943 0.829-3.058 0.829-3.361 0-6.085-2.742-6.085-6.125h-6.289c0.008 1.044-0.252 2.103-0.811 3.070-1.679 2.908-5.411 3.897-8.339 2.211l-3.144 5.447c0.905 0.515 1.689 1.268 2.246 2.234 1.676 2.903 0.672 6.623-2.241 8.319l3.145 5.447c0.895-0.522 1.935-0.82 3.044-0.82 3.35 0 6.067 2.725 6.084 6.092h6.289c-0.003-1.034 0.259-2.080 0.811-3.038 1.676-2.903 5.399-3.894 8.325-2.219l3.145-5.447c-0.899-0.515-1.678-1.266-2.232-2.226zM16 22.479c-3.578 0-6.479-2.901-6.479-6.479s2.901-6.479 6.479-6.479c3.578 0 6.479 2.901 6.479 6.479s-2.901 6.479-6.479 6.479z"></path>
		</symbol>
		<symbol id="icon-cloud" viewBox="0 0 32 32">
			<path
				d="M32 20.548c0-2.565-1.771-4.716-4.156-5.296-0.101-4.022-3.389-7.252-7.433-7.252-2.369 0-4.477 1.109-5.839 2.835-0.764-0.987-1.959-1.624-3.303-1.624-2.307 0-4.176 1.871-4.176 4.179 0 0.201 0.015 0.399 0.043 0.592-0.351-0.063-0.711-0.098-1.080-0.098-3.344-0-6.054 2.712-6.054 6.058s2.71 6.058 6.054 6.058l20.508-0c3.004-0.006 5.438-2.444 5.438-5.451z"
			></path>
		</symbol>
		<symbol id="icon-database" viewBox="0 0 32 32">
			<path
				d="M16 0c-8.837 0-16 2.239-16 5v4c0 2.761 7.163 5 16 5s16-2.239 16-5v-4c0-2.761-7.163-5-16-5z"
			></path>
			<path
				d="M16 17c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z"
			></path>
			<path
				d="M16 26c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z"
			></path>
		</symbol>
		<symbol id="icon-new-tab" viewBox="0 0 32 32">
			<path
				d="M6 2v24h24v-24h-24zM28 24h-20v-20h20v20zM4 28v-21l-2-2v25h25l-2-2h-21z"
			></path>
			<path d="M11 8l5 5-6 6 3 3 6-6 5 5v-13z"></path>
		</symbol>
		<symbol id="icon-home" viewBox="0 0 32 32">
			<path
				d="M32 19l-6-6v-9h-4v5l-6-6-16 16v1h4v10h10v-6h4v6h10v-10h4z"
			></path>
		</symbol>
		<symbol id="icon-power" viewBox="0 0 32 32">
			<path d="M12 0l-12 16h12l-8 16 28-20h-16l12-12z"></path>
		</symbol>
	</defs>
	</svg>
	<!-- /Icons -->
	<div class="background">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1909 1072.9412"><path class="stroke weight-1" d="M-2.028,242.454c1062.82,183.235,870.291,909.841,1909-161.612"></path><path class="stroke weight-2" d="M-2.382,274.253C1058,430.657,893.332,1142.082,1908.867,104.639"></path><path class="stroke weight-3" d="M-2.735,306.052c1057.94,129.572,921.136,825.817,1913.5-177.617"></path><path class="stroke weight-4" d="M-3.088,337.852c1055.5,102.739,946.558,783.8,1915.753-185.62"></path><path class="stroke weight-5" d="M-3.441,369.651c1053.06,75.908,971.98,741.791,1918.005-193.622"></path><path class="stroke weight-6" d="M-3.794,401.45c1050.619,49.076,997.4,699.779,1920.257-201.625"></path><path class="stroke weight-7" d="M-4.148,433.249c1048.18,22.244,1022.824,657.767,1922.51-209.627"></path><path class="stroke weight-8" d="M-4.5,465.049c1045.74-4.588,1048.246,615.753,1924.762-217.63"></path><path class="stroke weight-9" d="M-4.854,496.848c1043.3-31.42,1073.668,573.741,1927.014-225.633"></path><path class="stroke weight-10" d="M-5.207,528.647c1040.859-58.252,1099.09,531.729,1929.266-233.635"></path><path class="stroke weight-11" d="M-5.561,560.446c1038.42-85.083,1124.513,489.716,1931.519-241.638"></path><path class="stroke weight-12" d="M-5.914,592.246c1035.98-111.916,1149.934,447.7,1933.771-249.641"></path><path class="stroke weight-13" d="M-6.267,624.045C1027.272,485.3,1169.089,1029.736,1929.756,366.4"></path><path class="stroke weight-14" d="M-6.62,655.844c1031.1-165.579,1200.778,363.678,1938.275-265.646"></path><path class="stroke weight-15" d="M-6.973,687.643C1021.686,495.232,1219.227,1009.309,1933.554,414"></path><path class="stroke weight-16" d="M-7.327,719.443C1018.892,500.2,1244.3,999.1,1935.453,437.792"></path><path class="stroke weight-17" d="M-7.68,751.242C1016.1,505.167,1269.364,988.882,1937.352,461.588"></path><path class="stroke weight-18" d="M-8.033,783.041C1013.306,510.134,1294.433,978.669,1939.251,485.385"></path><path class="stroke weight-19" d="M-8.386,814.841C1010.512,515.1,1319.5,968.456,1941.15,509.181"></path><path class="stroke weight-20" d="M-8.74,846.64c1016.459-326.571,1353.311,111.6,1951.789-313.662"></path><path class="stroke weight-21" d="M-9.093,878.439c1014.019-353.4,1378.733,69.59,1954.041-321.664"></path><path class="stroke weight-22" d="M-9.446,910.238C1002.132,530,1394.709,937.816,1946.847,580.571"></path><path class="stroke weight-23" d="M-9.8,942.038C999.339,534.971,1419.777,927.6,1948.746,604.368"></path><path class="stroke weight-24" d="M-10.152,973.837c1006.7-433.9,1455-56.448,1960.8-345.673"></path><path class="stroke weight-25" d="M-10.506,1005.636c1004.258-460.731,1480.421-98.46,1963.05-353.675"></path><path class="stroke weight-26" d="M-10.859,1037.435c1001.818-487.562,1505.843-140.473,1965.3-361.677"></path><path class="stroke weight-27" d="M-11.212,1069.235C988.166,554.84,1520.053,886.749,1956.342,699.554"></path><path class="stroke weight-28" d="M-11.565,1101.034c996.937-541.227,1556.687-224.5,1969.806-377.683"></path><path class="stroke weight-29" d="M-11.919,1132.833C982.579,564.775,1570.19,866.322,1960.14,747.148"></path><path class="stroke weight-30" d="M-12.272,1164.632c992.058-594.89,1607.531-308.523,1974.311-393.688"></path><path class="stroke weight-31" d="M-12.625,1196.432C976.992,574.709,1620.328,845.9,1963.938,794.741"></path><path class="stroke weight-32" d="M-12.978,1228.231C974.2,579.677,1645.4,835.682,1965.837,818.537"></path></svg>
	</div>
	<div class="container">
		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-header">
						<div class="h5">
						<i class="icon">
							<svg class="icon-cloud icon-addon-clip">
								<use xlink:href="#icon-cloud"></use>
							</svg>
							<svg class="icon-cog icon-addon">
								<use xlink:href="#icon-cog"></use>
							</svg>
						</i>
							<strong>Cloudflare Worker</strong>
						</div>
						
						<div class="card-header-actions">
							<a class="btn btn-sm btn-secondary" href="https://dash.cloudflare.com/workers/overview">
								<svg class="icon icon-new-tab">
									<use xlink:href="#icon-new-tab"></use>
								</svg>
								Manage Worker
							</a>
						</div>
					</div>
					<div class="card-body">
						<dl class="row">
							<dt class="col-sm-4">Data Center</dt>
							<dd class="col-sm-8">${data.colo}</dd>
							<dt class="col-sm-4">Region Code</dt>
							<dd class="col-sm-8">${data.regionCode}</dd>
							<dt class="col-sm-4">Latitude</dt>
							<dd class="col-sm-8">${data.latitude}</dd>
							<dt class="col-sm-4">Longitude</dt>
							<dd class="col-sm-8">${data.longitude}</dd>
						</dl>
					</div>
				</div>
			</div>
			<div class="col">
				<div class="connection-diagram">
					<div class="connect"></div>
					<div class="connector text-center">
						<div class="connection-status ${data.connected ? 'connected' : 'error'}"></div>					
					</div>
					<div class="connect"></div>
				</div>
				<div class="connection-info  ${data.connected ? 'connected' : 'error'} text-center">
					<strong>${data.connected ? 'Connected' : 'Error'}</strong>
				</div>
			</div>
			<div class="col">
				<div class="card">
					<div class="card-header">
						<div class="h5">
							<i class="icon">
								<svg class="icon-database icon-addon-clip">
									<use xlink:href="#icon-database"></use>
								</svg>
								<svg class="icon-home icon-addon">
									<use xlink:href="#icon-home"></use>
								</svg>
							</i>
							<strong>RavenDB</strong>
						</div>
						
						<div class="card-header-actions">
							<a class="btn btn-sm btn-secondary" target="_blank" href="${data.url}/studio/index.html">
								<svg class="icon icon-new-tab">
									<use xlink:href="#icon-new-tab"></use>
								</svg> 
								Open Studio</a>
							</div>
					</div>
					<div class="card-body">
						<dl class="row">
							<dt class="col-sm-4">Cluster</dt>
							<dd class="col-sm-8">${data.url}</dd>
							<dt class="col-sm-4">Database</dt>
							<dd class="col-sm-8">${data.database}</dd>
							<dt class="col-sm-4">Version</dt>
							<dd class="col-sm-8">${data.version}</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>
		${
			data.error
				? String.raw`<div class="error-info row">
			<div class="col">
				<div class="card">
					<div class="card-header text-white bg-danger">
						<strong>Error connecting to RavenDB</strong>
					</div>
					<div class="card-body">
						<p class="lead">There was a problem establishing a connection to RavenDB. See below:</p>
						<pre><code>
${data.error.stack}</code></pre>
						<p>To get help, see <a href="#troubleshooting">Troubleshooting Guide</a>.</p>
					</div>
				</div>
			</div>
		</div>`
				: ''
		}
		<div class="next-steps row">
			<div class="col">
				<div class="card">
					<div class="card-header">
						<strong>Next Steps</strong>
					</div>
					<div class="card-body">
						<p>Upload your client certificate to Cloudflare using <code>wrangler</code>:</p>
						<pre><code>npx wrangler mtls-certificate upload \
  --cert "path/to/certificate.crt" \
  --key  "path/to/certificate.key" \
  --name "ravendb_cert"</code></pre>
						<p>Copy the <code>Certificate ID</code>, then update your <code>wrangler.toml</code> file to connect to your own cluster:</p>
						<pre><code>mtls_certificates = [
  { binding = "DB_CERT", certificate_id = "&lt;CERTIFICATE_ID&gt;" } 
]

[vars]
DB_URLS = ""
DB_NAME = ""</code></pre>
						<p>For a more detailed guide, see <a href="#docs">Using Cloudflare Workers with RavenDB</a>.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
	
</body>
</html>`;
}
