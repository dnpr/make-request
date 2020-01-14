import * as fs from "fs"
import * as path from "path"

import { createRequestStream, startStream, endStream } from "../src"

async function main() {
  try {
    const iStream = fs.createReadStream(path.join(__dirname, "test_req.json"))
    const oStream = fs.createWriteStream(path.join(__dirname, "test_res.json"))
    const imgStream = fs.createWriteStream(path.join(__dirname, "image.jpg"))

    /** Both end are streams, POST request. */
    const request1 = createRequestStream("POST", "https://reqbin.com/echo/post/json")
    iStream.pipe(request1).pipe(oStream)

    /** No request body, stream response body, GET request. */
    const request2 = createRequestStream("GET", "https://www.nationalgeographic.com/content/dam/news/2018/05/17/you-can-train-your-cat/02-cat-training-NationalGeographic_1484324.jpg")
    request2.end()
    request2.pipe(imgStream)

    /** Response info: headers, http status, etc. */
    request1.on("end", (info) => { console.log(info) })

    /** startStream, endStream. */
    const reqBody = startStream(JSON.stringify({
      username: "username", password: "password"
    }))
    const request3 = createRequestStream("POST", "https://reqbin.com/echo/post/json")
    const resBody = await endStream(reqBody.pipe(request3))
    console.log(resBody)

  } catch (error) {
    console.log(error)
  }
}

main()