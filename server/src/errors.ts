export class UserError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 409 | 422 | 502 = 400,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export class ParseError extends UserError {
  constructor(message: string) {
    super(`Não foi possível ler a nota: ${message}`, 422);
    this.name = "ParseError";
  }
}
