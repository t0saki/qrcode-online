/**
 * Compress bytes into a zlib (RFC 1950) stream — exactly what a PNG IDAT chunk
 * requires. `CompressionStream("deflate")` emits the zlib header + Adler-32, and
 * is available in both the Workers runtime and browsers.
 */
export async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}
