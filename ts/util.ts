import { encodeResolve } from './apix.ts';
import { decode as b64decode } from 'https://deno.land/std@0.196.0/encoding/base64.ts';

const PARSERS = new Map([
  ['b64', (value: string) => b64decode(value)],
  ['json', (value: string) => encodeResolve(JSON.parse(value))],
]);

export const getParser = (format: string) => PARSERS.get(format);
