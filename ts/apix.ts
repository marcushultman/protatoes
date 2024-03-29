import {
  addProto,
  createRoot,
  decode as _decode,
  decodeResolve as _decodeResolve,
  encode as _encode,
  encodeResolve as _encodeResolve,
  FileDescriptorProto,
  Root,
} from './api.ts';
import { JsonObject, toJSONByteString } from './json_util.ts';

const toOpts = ({ includes, authTokens }: Resolve) => ({
  includes: (includes ?? []).map((include) => new URL(include)),
  authTokens,
});

type Options = ReturnType<typeof toOpts>;

const makeTokenMap = (s?: string) =>
  new Map(s ? s.split(';').map((t) => t.split('@', 2).reverse() as [string, string]) : []);

async function fetchSource(path: string, { includes, authTokens }: Options): Promise<string> {
  const hostAuthToken = makeTokenMap(authTokens);
  const urls = includes.slice(0);
  try {
    urls.unshift(new URL(path));
  } catch (_: unknown) {
    // path not a URL
  }
  for (const include of urls) {
    const url = new URL(path, include);
    const token = hostAuthToken.get(url.host);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;
    const res = await fetch(url, { headers });
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
  const opts = toOpts(resolve);
  await Promise.all(resolve.entries?.map((entry) => addFromURL(root, entry, opts)) ?? []);
  roots.set(key, root);
  return root;
}

export type { JsonObject };

export interface File {
  name: string;
  source: string;
}

export interface Resolve {
  prefix?: string;
  entries?: string[];
  includes?: string[];
  files?: File[];
  authTokens?: string;
}

export function encodeResolve(obj: JsonObject<Resolve>): Uint8Array {
  return _encodeResolve(toJSONByteString(obj)).arr().slice(0);
}

export function decodeResolve<Resolve>(bin: Uint8Array): Resolve {
  return JSON.parse(_decodeResolve(bin));
}

export async function encode<T>(blob: Uint8Array, type: string, obj: JsonObject<T>) {
  return _encode(await getOrCreateRoot(blob), type, obj);
}

export async function decode<T>(blob: Uint8Array, type: string, bin: Uint8Array): Promise<T> {
  return _decode(await getOrCreateRoot(blob), type, bin);
}
