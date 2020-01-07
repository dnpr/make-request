import { makeRequest } from "../src"

const httpTarget = "http://httpbin.org"
const httpsTarget = "https://httpbin.org"
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"

async function main() {

  const headers = {
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": USER_AGENT
  }

  const testBody = {
    message: "hello world"
  }

  try {

    /** A GET request with HTTP. */
    const testHttp = makeRequest("GET", httpTarget + "/get").send()
    console.log((await testHttp).data.toString())

    /** A GET request with HTTPS. */
    const testHttps = makeRequest("GET", httpsTarget + "/get").send()
    console.log((await testHttps).data.toString())

    /** A GET request with HTTPS and headers. */
    const testHttpsHeader =
      makeRequest("GET", httpsTarget + "/get")
        .setHeaders(headers).send()
    console.log((await testHttpsHeader).data.toString())

    /** A POST request with JSON. */
    const testJson =
      makeRequest("POST", "https://reqbin.com/echo/post/json")
        .setSerializer(JSON.stringify)
        .setDeserializer(JSON.parse).send({
          login: "login", password: "password"
        })
    console.log((await testJson).data)

    /** A bad POST request with incorrectly serialized body. */
    const testBadJson =
      makeRequest("POST", "https://reqbin.com/echo/post/json").send(testBody)
    console.log((await testBadJson).data)

  } catch (error) {
    console.error(error)
  }
}

main()