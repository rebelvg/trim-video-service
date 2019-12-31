export class BadRequest extends Error {
  public status: number = 400;
  public message: string;
}

export class NotFound extends Error {
  public status: number = 404;
  public message: string;
}
