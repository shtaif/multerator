class MulteratorError<
  TInfo extends Record<string, unknown> | undefined = undefined
> extends Error {
  code: string;
  info?: TInfo;

  constructor(message: string, code: string, info?: TInfo) {
    super(message);
    this.code = code;
    this.info = info;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default MulteratorError;
