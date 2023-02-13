# Template: worker-ravendb

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ravendb/cloudflare-template-worker)

A batteries included template for kick starting a TypeScript Cloudflare worker project that connects with a RavenDB Cloud database backend.

## Setup

To create a `my-project` directory using this template, run:

```sh
$ npm init cloudflare my-project worker-ravendb
# or
$ yarn create cloudflare my-project worker-ravendb
# or
$ pnpm create cloudflare my-project worker-ravendb
```

> **Note:** Each command invokes [`create-cloudflare`](https://www.npmjs.com/package/create-cloudflare) for project creation.

To start the worker:

```sh
$ npm start
```

## Getting Started

RavenDB is a NoSQL distributed database platform designed for business applications.

> The easiest way to get started with RavenDB is by creating [a free RavenDB Cloud account](cloud-signup). 
>
> If you are _brand new_ to RavenDB, we recommend starting with the [Getting Started guide](docs-get-started), the [RavenDB bootcamp](learn-bootcamp), or the [Try RavenDB](learn-demo) experience.


You do not need a certificate to connect to the demo server at http://live-test.ravendb.net. Data is wiped everyday so it's perfect for testing.

> ⚠ The Live Test server is not meant for storing sensitive information, as communication is over HTTP. It is for dev-test only.

1. Open http://live-test.ravendb.net in your browser
1. Click "Databases" in the bottom left
1. Click "New Database" in the top right
1. Give your test DB a name
1. Copy that name to `wrangler.toml` or `.dev.vars`
1. Restart the worker
1. Visit `http://127.0.0.1:8787/` in your browser
1. You should see the output successfully

See the documentation for more guidance on [creating a new database](docs-create-db).

### Specifying Database Information

Modify the `wrangler.toml` file `vars` sections:

```
DB_URLS=https://a.free.your_instance.ravendb.cloud
DB_NAME=your_db
```

- `DB_URLS`: A comma-delimited list of database node URLs
- `DB_NAME`: The name of the database on the node to connect to

These settings don't _need_ to be secret because RavenDB is secured through certificate authentication but if you prefer using secrets, you can add them using the `.dev.vars` file and the dashboard. See, [Cloudflare Workers Environment Variables](cf-env) to learn more.

### Upload and Bind Your Database Certificate

RavenDB is secured using client-certificate authentication (or Mutual TLS). Cloudflare Workers supports mTLS authentication by uploading a certificate to the portal and binding it to your Worker using Wrangler.

First, in your RavenDB Cloud portal, download your client certificate package.

Next, unzip it and copy the paths to the `.crt` and `.key` files, since you will need the PEM versions (not the X.509 `.pfx` file).

Finally, in the project directory, run:

```sh
$ wrangler mtls add --name DB_CERT --cert ./path/to/certificate.crt --key ./path/to/certificate.key
```

This will update your `wrangler.toml` file to add a new certificate binding `DB_CERT` which RavenDB will use to access the database securely.

```toml
unsafe.bindings = [
  { type = "mtls_certificate", name = "DB_CERT", certificate_id = "814954ba-22ba-4d26-8da7-940425f2e1c6" }
]
```

Accessing the `env.DB_CERT` will provide a `fetch()` function that automatically uses the bound certificate.

It must be passed to RavenDB's request pipeline which is done for you in the template using the `bindFetcherToStore` method.

## Testing Certificate Authentication

To connect to your own instance using the mTLS certificate, be sure to update the `wrangler.toml` variables or `.dev.vars` values and the same values in your Cloudflare Workers dashboard (under Preview _and_ Production).

Once you have everything in place, you can test it locally by running:

```sh
$ npm start
```

Press "l" to enter non-local mode.

> **Note:** The `env.DB_CERT` binding will not be available in local mode, this is a known issue with wrangler2.

You should see the following message in the console:

> A bound cert was found and will be used for RavenDB requests.

## Troubleshooting

### `DatabaseDoesNotExist` error

The instance you're connecting to doesn't have a database yet (specified through `DB_NAME`).

Follow the instructions to [create a new database](docs-create-db) in the Studio.

### Cannot find `DB_CERT.fetch` function

Wrangler must be run in _non-local mode_ to populate the certificate binding environment variable.

When Wrangler boots up, press the `l` key to enter non-local mode, which will restart Wrangler and show a message like this:

TBD

[cloud-signup]: https://cloud.ravendb.net?utm_source=github&utm_medium=web&utm_campaign=oss_cloudflare_worker_template&utm_content=ravendb_cloud_signup
[docs-get-started]: https://ravendb.net/docs/article-page/csharp/start/getting-started?utm_source=github&utm_medium=web&utm_campaign=oss_cloudflare_worker_template&utm_content=get_started
[docs-create-db]: https://ravendb.net/docs/article-page/csharp/studio/database/create-new-database/general-flow?utm_source=github&utm_medium=web&utm_campaign=oss_cloudflare_worker_template&utm_content=docs_new_db
[learn-bootcamp]: https://ravendb.net/learn/bootcamp?utm_source=github&utm_medium=web&utm_campaign=oss_cloudflare_worker_template&utm_content=ravendb_bootcamp_signup
[learn-demo]: https://demo.ravendb.net/?utm_source=github&utm_medium=web&utm_campaign=oss_cloudflare_worker_template&utm_content=ravendb_try
[cf-env]: https://developers.cloudflare.com/workers/platform/environment-variables/