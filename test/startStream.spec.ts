import * as path from "path"
import * as fs from "fs"
import { test } from "zora"

import { startStream } from "../src/util"

(async function () {
  /** Behavior test. */
  console.log("--- Behavior Test ---");

  const promise = new Promise((resolve, reject) => {
    const catp = path.join(__dirname, "cat.jpg")
    const catf = fs.readFileSync(catp, { encoding: "utf-8" })
    const s = startStream(catf, { debug: true })
    /** Must listen to "data" event, so the stream can be activate. */
    s.on("data", () => { console.log("got a chunk") })
    s.on("end", () => { console.log("stream end"); resolve() })
    s.on("error", (err) => { reject(err) })
  })
  try {
    await promise
  } catch (err) {
    console.log(err)
  }

  /** Unit test. */
  console.log("\n--- Unit Test ---")

  test("startStream()", async (t) => {
    const promise = new Promise((resolve, reject) => {
      const catp = path.join(__dirname, "cat.jpg")
      const catf = fs.readFileSync(catp, { encoding: "utf-8" })
      const s = startStream(catf)
      s.on("data", () => { })
      s.on("end", () => { resolve() })
      s.on("error", (err) => { reject(err) })
    })
    try {
      await promise
      t.ok(true, `should receive "end" event`)
    } catch (err) {
      t.fail(`${err.name}: ${err.message}`)
    }
  })
})()
