import {
  addProto,
  createRoot,
  decode as _decode,
  decodeResolve,
  encode as _encode,
  encodeResolve,
  FileDescriptorProto,
  Resolve,
  Root,
} from './api.ts';

const toOpts = ({ includes, query }: Resolve) => ({
  includes: (includes ?? []).map((include) => new URL(include)),
  query,
});

type Options = ReturnType<typeof toOpts>;

function decorate(searchParams: URLSearchParams, params?: Record<string, string>) {
  Object.entries(params ?? []).map(([name, value]) => searchParams.set(name, value));
}

async function fetchSource(path: string, { includes, query }: Options): Promise<string> {
  const urls = includes.slice(0);
  try {
    urls.unshift(new URL(path));
  } catch (_: unknown) {
    // path not a URL
  }
  for (const include of urls) {
    const url = new URL(path, include);
    decorate(url.searchParams, query?.[path]?.params);
    const res = await fetch(url);
    if (res.ok) {
      return await res.text();
    }
  }
  throw new Error(`'${path}' not found`);
}

async function addFromURL(root: Root, name: string, opts: Options): Promise<FileDescriptorProto[]> {
  const source = await fetchSource(name, opts);
  const descriptor = addProto(root, name, source);
  const deps = await Promise.all(
    (descriptor.dependency ?? []).map((dep) => addFromURL(root, dep, opts)),
  );
  return [descriptor, ...deps.flat()];
}

const roots = new Map<string, Root>();

const makeKey = (arr: Uint8Array) => btoa(String.fromCharCode.apply(null, [...arr]));

async function getOrCreateRoot(bin: Uint8Array) {
  const key = makeKey(bin);
  let root = roots.get(key);
  if (root) {
    return root;
  }
  const resolve: Resolve = decodeResolve(bin);
  root = createRoot(resolve.prefix ?? 'type.googleapis.com');
  (resolve.files ?? []).map(({ name, source }) => addProto(root, name, source));
  resolve.entry && await addFromURL(root, resolve.entry, toOpts(resolve));
  roots.set(key, root);
  return root;
}

export { encodeResolve };
export type { Resolve };

export async function encode(blob: Uint8Array, type: string, obj: unknown): Promise<Uint8Array> {
  return _encode(await getOrCreateRoot(blob), type, obj);
}

export async function decode<T>(blob: Uint8Array, type: string, bin: Uint8Array): Promise<T> {
  return _decode(await getOrCreateRoot(blob), type, bin);
}
