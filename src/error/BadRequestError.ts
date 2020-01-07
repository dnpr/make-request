/**
 * @category Error
 */
export class BadRequestError extends Error {
  name = "BadRequestError"

  constructor (message: string) {
    super()
    Object.setPrototypeOf(this, BadRequestError.prototype)
    this.message = message
  }
}