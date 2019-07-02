'use strict'

const http = require('http')
const https = require('https')
const zlib = require('zlib')

module.exports = { makeHTTPRequest, makeHTTPSRequest }

/** Wrappers for makeRequest(). */
function makeHTTPRequest(options, payload) {
  return makeRequest(options, payload, false)
}

function makeHTTPSRequest(options, payload) {
  return makeRequest(options, payload, true)
}

/**
 * @typedef Response
 * @property {number} statusCode
 * @property {Buffer} responseBuffer
 */

/**
 * Send a http request and get the response.
 * @param {*} options - Options passed to http/https.request().
 * @param {*} payload - Request body.
 * @param {boolean} isHttps - Whether to use HTTPS.
 * @returns {Promise.<Response>} Response object.
 */
function makeRequest(options, payload, isHttps) {

  return new Promise((resolve, reject) => {

    const req = isHttps
      ? https.request(options, (res) => { collectResponse(res, resolve) })
      : http.request(options, (res) => { collectResponse(res, resolve) })

    /**
     * On request error.
     */
    req.on('error', (error) => {
      reject(error)
    })

    /**
     * Write the payload.
     */
    if (payload != null) {
      req.write(payload)
    }
    req.end()

  })

}

/**
 * Collect response data.
 * @param {http.ServerResponse | https.ServerResponse} res - A Node.js HTTP/HTTPS response object.
 * @param {Function} callback - Callback function.
 */
function collectResponse(res, callback) {

  /**
   * zlib accepts Buffer, not string, so we need to collect chucks in an array,
   * and use Buffer.concat() to combine them.
   */
  let data = []
  let encoding = res.headers['content-encoding']

  /**
   * If no compression is used.
   */
  if (encoding === 'undefined') {
    res.setEncoding('utf-8')
  }

  /**
   * On data chuck received.
   */
  res.on('data', (chunk) => {
    data.push(chunk)
  })

  /**
   * On response end.
   */
  res.on('end', () => {
    let buffer = Buffer.concat(data)
    if (encoding === 'gzip') {
      buffer = zlib.gunzipSync(buffer)
    } else if (encoding === 'deflate') {
      buffer = zlib.inflateSync(buffer)
    }
    callback({
      statusCode: res.statusCode,
      responseBuffer: buffer
    })
  })

}