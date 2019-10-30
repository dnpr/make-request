const { makeHTTPSRequest, makeHTTPRequest } = require('../lib')

const BASE_URL = 'httpbin.org'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'

const headers = {
  'accept': '*/*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': USER_AGENT
}

const httpsAgentOptions = {
  hostname: BASE_URL,
  port: 443,
  path: '/get',
  method: 'GET',
  headers
}

const httpAgentOptions = {
  hostname: BASE_URL,
  port: 80,
  path: '/get',
  method: 'GET',
  headers
}

async function main() {
  try {
    /** Test HTTPS. */
    let res = await makeHTTPSRequest(httpsAgentOptions)
    let resParsed = {
      statusCode: res.statusCode,
      data: JSON.parse(res.responseBuffer)
    }
    console.log(resParsed)

    /** Test HTTP. */
    res = await makeHTTPRequest(httpAgentOptions)
    resParsed = {
      statusCode: res.statusCode,
      data: JSON.parse(res.responseBuffer)
    }
    console.log(resParsed)
  } catch (error) {
    console.error(error)
  }
}

main()