import { encodeResolve } from './apix.ts';

const b64Decode = (s: string) => new Uint8Array([...atob(s)].map((c) => c.charCodeAt(0)));

const ENCODERS = new Map<string, (value: string) => Uint8Array>([
  ['b64', (b64) => b64Decode(b64)],
  ['json', (json) => encodeResolve(JSON.parse(json))],
]);

export const getEncoder = (type: string) => ENCODERS.get(type);
