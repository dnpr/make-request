import { URL } from "url"
import * as stream from "stream"
import * as zlib from "zlib"

/**
 * Infer which port to use.
 * 
 * @category Util
 */
function inferPort(url: URL) {
  const port = url.port
    ? url.port : (url.protocol === "http:")
      ? 80 : 443
  return port
}



/**
 * Check if protocol is supported.
 * 
 * @category Util
 */
function isProtocolSupported(url: URL) {
  return url.protocol === "http:" || url.protocol === "https:"
}



/**
 * Create a read stream from some data.
 * @param data 
 * @param _opt 
 */
function startStream(data: string, _opt?: { debug?: boolean }) {
  const debug = _opt && _opt.debug
  const buffer = Buffer.from(data)
  let ptr = 0
  return new stream.Readable({
    read(size) {
      if (debug) console.log(size, ptr)
      if (ptr > buffer.length) {
        this.push(null)
      } else {
        this.push(buffer.slice(ptr, ptr += size))
      }
    }
  })
}



/**
 * Collect all chunks and concat their content as one string.
 * @param readStream 
 */
function endStream(readStream: NodeJS.ReadableStream) {
  return new Promise<string>((resolve, reject) => {
    let chunks: Buffer[] = []
    readStream.on("data", (chunk) => { chunks.push(chunk) })
    readStream.on("end", () => { resolve(Buffer.concat(chunks).toString()) })
    readStream.on("error", (error) => { reject(error) })
  })
}



/**
 * Decompress a stream.
 * @param iStream 
 * @param encoding 
 */
function decompressStream(
  iStream: NodeJS.ReadableStream,
  encoding?: "br" | "gzip" | "deflate" | string
): NodeJS.ReadableStream {
  switch (encoding) {
    case "br":
      return iStream.pipe(zlib.createBrotliDecompress())
    case "gzip":
      return iStream.pipe(zlib.createGunzip())
    case "deflate":
      return iStream.pipe(zlib.createInflate())
    default:
      return iStream
  }
}

export {
  inferPort, isProtocolSupported,
  startStream, endStream, decompressStream
}