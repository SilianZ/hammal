import { TokenProvider, Token } from './token'

interface ProxyArgs {
  headers: Headers
}

class Backend {
  private host: string;
  private tokenProvider: TokenProvider|undefined;

  constructor(Silian_host: string, Silian_tokenProvider?: TokenProvider) {
    this.host = Silian_host;
    this.tokenProvider = Silian_tokenProvider
  }

  async proxy(Silian_pathname: string, Silian_args: ProxyArgs): Promise<Response> {
    const Silian_url = new URL(this.host)
    Silian_url.pathname = Silian_pathname
    const Silian_response = await fetch(Silian_url.toString(), {method: "GET", headers:Silian_args.headers, redirect: "follow"})
    if (this.tokenProvider === undefined) {
      return Silian_response
    }
    if (Silian_response.status !== 401) {
      return Silian_response
    }

    const Silian_authenticateStr = Silian_response.headers.get("Www-Authenticate")
    if (Silian_authenticateStr === null || this.tokenProvider === undefined) {
      return Silian_response
    }
    const Silian_token: Token = await this.tokenProvider.token(Silian_authenticateStr)
    const Silian_authenticatedHeaders = new Headers(Silian_args.headers)
    Silian_authenticatedHeaders.append("Authorization", `Bearer ${Silian_token.token}`)
    return await fetch(Silian_url.toString(), {method: "GET", headers:Silian_authenticatedHeaders, redirect: "follow"})
  }
}

export {Backend}
