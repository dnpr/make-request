# make-request

A simple HTTP / HTTPS agent for Node.js.

## Documentation

* [Installation](#Installation)
* [Usage](#Usage)
* [Development](#Development)

## Installation

```bash
npm install @dnpr/make-request
```

## Usage

```javascript
const { makeHTTPSRequest } = require('@dnpr/make-request')

const BASE_URL = 'httpbin.org'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'

const headers = {
  'accept': '*/*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': USER_AGENT
}

/** The same as options in NodeJS https.request() */
const httpsAgentOptions = {
  hostname: BASE_URL,
  port: 443,
  path: '/get',
  method: 'GET',
  headers
}

async function main() {
  try {
    let res = await makeHTTPSRequest(httpsAgentOptions)
    let resParsed = {
      statusCode: res.statusCode,
      data: JSON.parse(res.responseBuffer)
    }
    console.log(resParsed)
  } catch {
    console.error(error)
  }
}
```

## Development

Clone the repository and setup.

```bash
git clone https://github.com/dnpr/make-request.git
npm install # or any package manager
```

Run tests.

```bash
npm test
```