export type JsonObject<T> = Uint8Array | string | NonNullable<T>;

export function toJSONByteString<T>(obj: JsonObject<T>) {
  if (obj instanceof Uint8Array) {
    return obj;
  }
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return new TextEncoder().encode(str);
}
