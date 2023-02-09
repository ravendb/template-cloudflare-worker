# Template: worker-ravendb

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ravendb/cloudflare-template-worker)

A batteries included template for kick starting a TypeScript Cloudflare worker project that connects with a RavenDB Cloud database backend. It also uses the Cloudflare request information to choose the closest cluster node to the Worker to serve requests.

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

### Specifying Database Information

Add a `.dev.vars` file (which is hidden in Git):

```
DB_URLS=https://a.free.your_instance.ravendb.cloud
DB_NAME=your_db
```

- `DB_URLS`: A comma-delimited list of database node URLs
- `DB_NAME`: The name of the database on the node to connect to

You will also need to add these variables using the Cloudflare Worker dashboard for both the Preview and Production environments.

### Using Your Database Certificate

RavenDB is secured using client-certificate authentication (or Mutual TLS). Cloudflare Workers supports mTLS authentication by uploading a certificate to the portal and binding it to your Worker using Wrangler.

First, in your RavenDB Cloud portal, download your client certificate package.

Next, unzip it and copy the paths to the `.crt` and `.key` files, since you will need the PEM versions (not the X.509 `.pfx` file).

Finally, in the project directory, run:

```sh
$ wrangler mtls add --name DB_CERT --cert ./path/to/certificate.crt --key ./path/to/certificate.key
```

This will update your `wrangler.toml` file to add a new certificate binding `DB_CERT` which RavenDB will use to access the database securely.

## Testing Connectivity

### Without a Certificate

You do not need a certificate to connect to the demo server at http://live-test.ravendb.net. Data is wiped everyday so it's perfect for testing.

1. Open http://live-test.ravendb.net in your browser
1. Click "Databases"
1. Click "New Database"
1. Give your test DB a name
1. Copy that name to `.dev.vars`
1. Restart the worker

It should connect successfully.

### With a Certificate

To connect to your own instance, update the `.dev.vars` values and the same values in your Cloudflare Workers dashboard.

## Troubleshooting

### Cannot find `DB_CERT.fetch` function

Wrangler must be run in _non-local mode_ to populate the certificate binding environment variable.

When Wrangler boots up, press the `l` key to enter non-local mode, which will restart Wrangler and show a message like this:

TBD