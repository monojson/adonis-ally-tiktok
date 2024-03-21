/*
|--------------------------------------------------------------------------
| Ally Oauth driver for tiktok
|--------------------------------------------------------------------------
*/

import { ApiRequest, Oauth2Driver, RedirectRequest } from '@adonisjs/ally'
import type {
  AllyDriverContract,
  AllyUserContract,
  ApiRequestContract,
  LiteralStringUnion,
} from '@adonisjs/ally/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { HttpClient } from '@poppinss/oauth-client'

/**
 * Access token returned by tiktok
 */
export type TikTokAccessToken = {
  token: string
  type: 'bearer'
}

/**
 * Available tiktok scopes
 * https://developers.tiktok.com/doc/tiktok-api-scopes/
 */
export type TikTokScopes =
  | 'portability.activity.ongoing'
  | 'portability.activity.single'
  | 'portability.all.ongoing'
  | 'portability.all.single'
  | 'portability.directmessages.ongoing'
  | 'portability.directmessages.single'
  | 'portability.postsandprofile.ongoing'
  | 'portability.postsandprofile.single'
  | 'research.adlib.basic'
  | 'research.data.basic'
  | 'user.info.basic'
  | 'user.info.profile'
  | 'video.list'
  | 'video.publish'
  | 'video.upload'

export type TikTokConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
  authorizeUrl?: string
  accessTokenUrl?: string
  userInfoUrl?: string
  scopes?: LiteralStringUnion<TikTokScopes>[]
}

/**
 * TikTok Driver implementation.
 */
export class TikTokDriver
  extends Oauth2Driver<TikTokAccessToken, TikTokScopes>
  implements AllyDriverContract<TikTokAccessToken, TikTokScopes>
{
  /**
   * The URL for the redirect request. The user will be redirected on this * page to authorize the request.
   */
  protected authorizeUrl = 'https://www.tiktok.com/v2/auth/authorize/'

  /**
   * The URL to hit to exchange the authorization code for the access token
   */
  protected accessTokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'

  /**
   * The URL to hit to get the user details
   */
  protected userInfoUrl = 'https://open.tiktokapis.com/v2/user/info/'

  /**
   * The param name for the authorization code.
   */
  protected codeParamName = 'code'

  /**
   * The param name for the error.
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token. Make sure it is always unique.
   */
  protected stateCookieName = 'tiktok_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   */
  protected stateParamName = 'state'

  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  protected userProfileFields = [
    'open_id',
    'union_id',
    'avatar_url',
    'avatar_url_100',
    'avatar_large_url',
    'display_name',
  ]

  constructor(
    ctx: HttpContext,
    public config: TikTokConfig
  ) {
    super(ctx, config)

    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     */
    this.loadState()
  }

  /**
   * If the error received during redirect
   */
  accessDenied() {
    const error = this.getError()
    if (!error) {
      return false
    }

    return error === 'invalid_request'
  }

  protected configureRedirectRequest(request: RedirectRequest<TikTokScopes>) {
    const scopes = this.config.scopes || ['user.info.basic']
    request.param(this.scopeParamName, scopes.join(','))
    request.param('client_key', this.config.clientId)
    request.param('response_type', 'code')
    // tiktok use client_key instead of client_id
    request.clearParam('client_id')
  }

  protected configureAccessTokenRequest(request: ApiRequest) {
    request
      .header('Content-Type', 'application/x-www-form-urlencoded')
      .field('grant_type', 'authorization_code')
      .field('client_key', this.config.clientId)
      .field('client_secret', this.config.clientSecret)
      .field('redirect_uri', this.config.callbackUrl)
      .field('code', this.ctx.request.input(this.codeParamName))
  }

  /**
   * Get the user details by tiktok API.
   * https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info/
   */
  async user(
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<TikTokAccessToken>> {
    const accessToken = await this.accessToken(callback)
    const user = await this.getUserInfo(accessToken.token, callback)
    return {
      ...user,
      token: accessToken,
    }
  }

  async userFromToken(
    accessToken: string,
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<TikTokAccessToken>> {
    const user = await this.getUserInfo(accessToken, callback)

    return {
      ...user,
      token: { token: accessToken, type: 'bearer' as const },
    }
  }

  protected async getUserInfo(token: string, callback?: (request: ApiRequest) => void) {
    const request = this.getAuthenticatedRequest(this.config.userInfoUrl || this.userInfoUrl, token)

    if (typeof callback === 'function') {
      callback(request)
    }

    const response = await request.get()
    const user = response.data?.user
    return {
      id: user.union_id,
      nickName: user.display_name,
      name: user.display_name,
      avatarUrl: user.avatar_large_url,
      email: '',
      emailVerificationState: 'unsupported' as const,
      original: response,
    }
  }

  protected getAuthenticatedRequest(url: string, token: string): HttpClient {
    const request = this.httpClient(url)
    request.header('Authorization', `Bearer ${token}`)
    request.param('fields', this.userProfileFields.join(','))
    request.parseAs('json')
    return request
  }
}

/**
 * The factory function to reference the driver implementation
 * inside the "config/ally.ts" file.
 */
export function TikTokService(config: TikTokConfig): (ctx: HttpContext) => TikTokDriver {
  return (ctx) => new TikTokDriver(ctx, config)
}
