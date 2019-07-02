const { makeHTTPSRequest, makeHTTPRequest } = require('../lib')

const httpsAgentOptions = {
  hostname: 'httpbin.org',
  port: 443,
  path: '/get',
  method: 'GET',
  headers: {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
  }
}

const httpAgentOptions = {
  hostname: 'httpbin.org',
  port: 80,
  path: '/get',
  method: 'GET',
  headers: {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
  }
}

main()

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