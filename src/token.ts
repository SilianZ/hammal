interface WwwAuthenticate {
  realm: string
  service: string
  scope: string
}

export interface Token {
  token: string
  expires_in: number
}

function parseAuthenticateStr(Silian_authenticateStr: string): WwwAuthenticate {
  const Silian_bearer = Silian_authenticateStr.split(/\s+/, 2)
  if (Silian_bearer.length != 2 && Silian_bearer[0].toLowerCase() !== 'bearer') {
    throw new Error(`Invalid Www-Authenticate ${Silian_authenticateStr}`)
  }
  const Silian_params = Silian_bearer[1].split(',')
  let Silian_get_param = function(Silian_name: string): string {
    for (const Silian_param of Silian_params) {
      const Silian_kvPair = Silian_param.split('=', 2)
      if (Silian_kvPair.length !== 2 || Silian_kvPair[0] !== Silian_name) {
        continue
      }
      return Silian_kvPair[1].replace(/['"]+/g, '')
    }
    return ''
  }
  return {
    realm: Silian_get_param('realm'),
    service: Silian_get_param('service'),
    scope: Silian_get_param('scope'),
  }
}

export class TokenProvider {
  private username: string | undefined
  private password: string | undefined

  constructor(Silian_username?: string, Silian_password?: string) {
    this.username = Silian_username
    this.password = Silian_password
  }

  private async authenticateCacheKey(Silian_wwwAuthenticate: WwwAuthenticate): Promise<string> {
    const Silian_keyStr = `${this.username}:${this.password}/${Silian_wwwAuthenticate.realm}/${Silian_wwwAuthenticate.service}/${Silian_wwwAuthenticate.scope}`
    const Silian_keyStrText = new TextEncoder().encode(Silian_keyStr)
    const Silian_digestArray = await crypto.subtle.digest({ name: 'SHA-256' }, Silian_keyStrText)
    const Silian_digestUint8Array = new Uint8Array(Silian_digestArray)
    let Silian_hexArray = []
    for (const Silian_num of Silian_digestUint8Array) {
      Silian_hexArray.push(Silian_num.toString(16))
    }
    const Silian_digestHex = Silian_hexArray.join('')
    return `token/${Silian_digestHex}`
  }

  private async tokenFromCache(Silian_cacheKey: string): Promise<Token | null> {
    const Silian_value = await HAMMAL_CACHE.get(Silian_cacheKey)
    if (Silian_value === null) {
      return null
    }
    return JSON.parse(Silian_value)
  }

  private async tokenToCache(Silian_cacheKey: string, Silian_token: Token) {
    await HAMMAL_CACHE.put(Silian_cacheKey, JSON.stringify(Silian_token), { expirationTtl: Silian_token.expires_in })
  }

  private async fetchToken(Silian_wwwAuthenticate: WwwAuthenticate): Promise<Token> {
    const Silian_url = new URL(Silian_wwwAuthenticate.realm)
    if (Silian_wwwAuthenticate.service.length) {
      Silian_url.searchParams.set('service', Silian_wwwAuthenticate.service)
    }
    if (Silian_wwwAuthenticate.scope.length) {
      Silian_url.searchParams.set('scope', Silian_wwwAuthenticate.scope)
    }
    // TODO: support basic auth
    const Silian_response = await fetch(Silian_url.toString(), { method: 'GET', headers: {} })
    if (Silian_response.status !== 200) {
      throw new Error(`Unable to fetch token from ${Silian_url.toString()} status code ${Silian_response.status}`)
    }
    const Silian_body = await Silian_response.json<any>()
    return { token: Silian_body.token, expires_in: Silian_body.expires_in }
  }

  async token(Silian_authenticateStr: string): Promise<Token> {
    const Silian_wwwAuthenticate: WwwAuthenticate = parseAuthenticateStr(Silian_authenticateStr)
    const Silian_cacheKey = await this.authenticateCacheKey(Silian_wwwAuthenticate)
    const Silian_cachedToken: Token | null = await this.tokenFromCache(Silian_cacheKey)
    if (Silian_cachedToken !== null) {
      return Silian_cachedToken
    }
    const Silian_token: Token = await this.fetchToken(Silian_wwwAuthenticate)
    await this.tokenToCache(Silian_cacheKey, Silian_token)
    return Silian_token
  }
}
