import * as http from "http"
import * as https from "https"
import * as stream from "stream"
import * as zlib from "zlib"
import { URL } from "url"

import {
  inferPort, isProtocolSupported, decompressStream,
  startStream, endStream
} from "./util"
import { BadRequestError } from "./error/BadRequestError"
import { UnsupportedProtocolError } from "./error/UnsupportedProtocolError"

interface CustomResponse {
  internal: http.IncomingMessage
  buffer: Buffer
}

function makeRequest(verb: string, url: string) {

  const [request, responsePromise] = createHttpRequest(verb, url)
  let serializer, deserializer

  const send = async function (requestData?: any) {
    try {

      /** Serialize request body. */
      const payload = serializer
        ? serializer(requestData) : requestData

      /** Overwrite supported encoding. */
      request.setHeader("accept-encoding", "gzip, deflate")

      /** Write request payload. */
      if (payload) {
        if (typeof payload === "string" || Buffer.isBuffer(payload)) {
          request.write(payload)
        } else {
          throw new BadRequestError(`Request payload must be one of type string or Buffer. Received type ${typeof payload}`)
        }
      }

      /** Send request. */
      request.end()

      /** Wait for the response. */
      const response = await responsePromise

      /** Deserialize response body. */
      const responseData = deserializer
        ? deserializer(response.buffer) : response.buffer

      return {
        statusCode: response.internal.statusCode,
        data: responseData
      }

    } catch (error) {
      /** Cancel request. */
      request.abort()
      throw error
    }
  }

  const setSerializer = function (f: Function) {
    if (typeof f === "function") serializer = f
    return self
  }

  const setDeserializer = function (f: Function) {
    if (typeof f === "function") deserializer = f
    return self
  }

  const setHeaders = function (h: object) {
    if (typeof h === "object") {
      for (let [key, value] of Object.entries(h)) {
        request.setHeader(key, value)
      }
    }
    return self
  }

  const self = {
    send,
    setSerializer,
    setDeserializer,
    setHeaders
  }

  return self
}

function createHttpRequest(
  verb, url
): [http.ClientRequest, Promise<CustomResponse>] {

  const structuredUrl = new URL(url)

  if (!isProtocolSupported(structuredUrl)) {
    throw new UnsupportedProtocolError(
      `${structuredUrl.protocol} is not supported by this library.`
    )
  }

  /** "authority" only exists in HTTP/2. */
  const requestOpts: http.ClientRequestArgs = {
    hostname: structuredUrl.hostname,
    port: inferPort(structuredUrl),
    path: structuredUrl.pathname + structuredUrl.search,
    method: verb,
    headers: {}
  }

  let resolver, rejector
  const response: Promise<CustomResponse> =
    new Promise((resolve, reject) => {
      resolver = resolve
      rejector = reject
    })

  const request = structuredUrl.protocol === "http:"
    ? http.request(requestOpts, (res) => collectResponse(res, resolver))
    : https.request(requestOpts, (res) => collectResponse(res, resolver))

  request.on("error", (error) => rejector(error))

  return [request, response]

}

/**
 * Collect response data.
 */
function collectResponse(
  res: http.IncomingMessage,
  callback: (args: CustomResponse) => void
) {

  /**
   * zlib accepts Buffer, not string, so we need to collect chucks in an 
   * array, and use Buffer.concat() to combine them.
   */
  let data: Buffer[] = []
  let encoding = res.headers["content-encoding"]

  /**
   * If no compression is used.
   */
  if (encoding === "undefined") {
    res.setEncoding("utf-8")
  }

  /**
   * On data chuck received.
   */
  res.on("data", (chunk) => {
    data.push(chunk)
  })

  /**
   * On response end.
   */
  res.on("end", () => {
    let buffer = Buffer.concat(data)
    if (encoding === "gzip") {
      buffer = zlib.gunzipSync(buffer)
    } else if (encoding === "deflate") {
      buffer = zlib.inflateSync(buffer)
    }
    callback({
      internal: res, buffer
    })
  })

}



/**
 * Create a http.clientRequest instance.
 * @param verb 
 * @param url 
 */
function createClientRequest(verb: string, url: string) {

  const structuredUrl = new URL(url)

  if (!isProtocolSupported(structuredUrl)) {
    throw new UnsupportedProtocolError(
      `${structuredUrl.protocol} is not supported by this library.`
    )
  }

  const agentOptions: http.ClientRequestArgs = {
    hostname: structuredUrl.hostname,
    port: inferPort(structuredUrl),
    path: structuredUrl.pathname + structuredUrl.search,
    method: verb,
    headers: {}
  }

  const clientRequest = structuredUrl.protocol === "http:"
    ? http.request(agentOptions)
    : https.request(agentOptions)

  return clientRequest

}



type ResponseInfo =
  Pick<http.IncomingMessage, "complete" | "headers" | "httpVersion"
    | "statusCode" | "statusMessage" | "trailers">

/**
 * RequestStream wraps http.ClientRequest and http.IncomingMessage into 
 * a duplex stream.
 */
class RequestStream extends stream.Duplex {

  request: http.ClientRequest
  responseReceiver: NodeJS.WritableStream | undefined

  constructor(verb: string, url: string) {
    super()
    this.request = createClientRequest(verb, url)
    this.request.setHeader("accept-encoding", "br, gzip, deflate")
    this.responseReceiver = undefined

    this.request.on("response", (response) => {

      const responseDecomp = decompressStream(
        response,
        response.headers["content-encoding"]
      )

      if (this.responseReceiver)
        responseDecomp.pipe(this.responseReceiver as NodeJS.WritableStream)

      responseDecomp.on("error", (err) => {
        this.emit("error", err)
      })

      responseDecomp.on("data", (chunk) => {
        this.emit("data", chunk)
      })

      responseDecomp.on("close", () => {
        this.emit("close")
      })

      responseDecomp.on("end", () => {
        this.emit("end", {
          complete: response.complete,
          headers: response.headers,
          httpVersion: response.httpVersion,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          trailers: response.trailers
        } as ResponseInfo)
      })
    }) // request.on("response")

    this.request.on("error", (err) => {
      this.emit("error", err)
    })
  } // constructor

  _read() { }

  _write(data: any, encoding: string, cb) {
    encoding = encoding // since no unused
    this.request.write(data)
    cb()
  }

  end() {
    this.request.end()
  }

  pipe(writeStream: NodeJS.WritableStream): NodeJS.ReadableStream | any {
    this.responseReceiver = writeStream
    return writeStream
  }

  setHeaders(h: object) {
    if (typeof h === "object") {
      for (let [key, value] of Object.entries(h)) {
        this.request.setHeader(key, value)
      }
    }
  }
}



/**
 * Create a RequestStream instance.
 * @param verb - HTTP verb.
 * @param url - Request URL.
 */
function createRequestStream(verb: string, url: string) {
  return new RequestStream(verb, url)
}

export { makeRequest, createRequestStream, startStream, endStream }