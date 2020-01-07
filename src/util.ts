import { URL } from "url"

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



export { inferPort, isProtocolSupported }