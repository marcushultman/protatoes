import loadWasm from '../bin/api.js';

const {
  copyProto,
  createRoot,
  decode: _decode,
  encode: _encode,
  moveProto,
  parseFile,
  release,
} = await loadWasm();

export { copyProto, createRoot, moveProto, parseFile, release };

export type Root = unknown;

export function encode(root: Root, type: string, obj: unknown): Uint8Array {
  return _encode(root, type, JSON.stringify(obj));
}

export function decode<T>(root: Root, type: string, bin: Uint8Array): T {
  return JSON.parse(_decode(root, type, bin));
}
