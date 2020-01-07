/**
 * @category Error
 */
export class UnsupportedProtocolError extends Error {
  name = "UnsupportedProtocolError"

  constructor (message: string) {
    super()
    Object.setPrototypeOf(this, UnsupportedProtocolError.prototype)
    this.message = message
  }
}