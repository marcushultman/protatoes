import { Application, Context, Router } from 'https://deno.land/x/oak/mod.ts';
import { createRoot, decode, encode, moveProto, parseFile, release, Root } from './api.ts';

interface MessageEntry {
  createdAt: Date;
  updatedAt: Date;
  root: Root;
}

const namespaces = new Map<string, MessageEntry>();

const MAX_ENTRIES = Number.parseInt(Deno.env.get('MAX_ENTRIES') ?? '64');
const ONE_HOUR = 60 * 60 * 1000;

function prune() {
  const now = new Date().getTime();
  const removed: string[] = [];
  namespaces.forEach(({ updatedAt }, namespace) => {
    if (updatedAt.getTime() + ONE_HOUR < now) {
      namespaces.delete(namespace);
      removed.push(namespace);
    }
  });
  if (removed.length) {
    console.log(`Pruned ${removed.length} namespaces (${removed})`);
  }
}

function ensureNamespace(namespace: string) {
  const updatedAt = new Date();
  const entry = namespaces.get(namespace);
  if (entry) {
    namespaces.set(namespace, { ...entry, updatedAt });
  } else {
    namespaces.set(namespace, { root: createRoot(namespace), createdAt: updatedAt, updatedAt });
    console.log(`Namespace '${namespace}' created (namespaces: ${namespaces.size})`);
  }
}

const getContentType = (ctx: Context) => ctx.request.headers.get('content-type');

const router = new Router();
router
  .post('/:namespace', (ctx) => {
    const cctx: Context = ctx;
    prune();
    cctx.assert(namespaces.size < MAX_ENTRIES, 429);
    ensureNamespace(ctx.params.namespace);
    ctx.response.status = 202;
  })
  .delete('/:namespace', (ctx) => {
    const cctx: Context = ctx;
    const { namespace } = ctx.params;
    const entry = namespaces.get(namespace);
    cctx.assert(entry, 404);
    release(entry.root);
    namespaces.delete(namespace);
    console.log(`Namespace '${namespace}' deleted (namespaces: ${namespaces.size})`);
    ctx.response.status = 202;
  })
  .post('/:namespace/proto/:name', async (ctx) => {
    const cctx: Context = ctx;
    const { name, namespace } = ctx.params;
    const entry = namespaces.get(namespace);
    cctx.assert(entry, 404);

    // todo: access control
    const source = await ctx.request.body({ type: 'text' }).value;

    // todo: implement
    cctx.assert(!source.startsWith('https://'), 500); // not implemented

    moveProto(entry.root, parseFile(name, source));
    console.log(`File '${name}' added`);
    ctx.response.status = 202;
  })
  .post('/:namespace/encode/:type', async (ctx) => {
    const cctx: Context = ctx;
    const { type, namespace } = ctx.params;
    const entry = namespaces.get(namespace);
    cctx.assert(entry, 404);
    cctx.assert(getContentType(ctx) === 'application/json', 400);
    const bytes = encode(entry.root, type, await ctx.request.body({ type: 'json' }).value);
    console.log(`Encoding ${type} (${bytes.byteLength} bytes)`);
    ctx.response.body = bytes;
  })
  .post('/:namespace/decode/:type', async (ctx) => {
    const cctx: Context = ctx;
    const { type, namespace } = ctx.params;
    const entry = namespaces.get(namespace);
    cctx.assert(entry, 404);
    cctx.assert(getContentType(ctx) === 'application/protobuf', 400);
    const bytes = await ctx.request.body({ type: 'bytes' }).value;
    console.log(`Decoding ${type} (${bytes.byteLength} bytes)`);
    ctx.response.body = decode(entry.root, type, bytes);
  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
