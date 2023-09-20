import { Status } from '@arena-im/chat-types';
import { Credentials } from '@arena-im/core';
import { Liveblog } from './liveblog/liveblog';
import { ConfigProperties, LiveConfig } from './config';

/**
 * Liveblog SDK Client
 *
 * To use this SDK, call the {@link ArenaLiveblog} function as early as possible when
 * loading the web page
 *
 * @example
 *
 * ```
 *
 * import ArenaLiveblog from '@arenaim/liveblog-sdk';
 *
 * const arenaLiveblog = new Liveblog('API_KEY')
 *```
 */
export class ArenaLiveblog {
  public constructor(apiKey: string, env: ConfigProperties) {
    Credentials.apiKey = apiKey;
    new LiveConfig(env)
  }

  public async getLiveblog(slug: string): Promise<Liveblog> {
    try {
      const liveblog = await Liveblog.getInstance(slug);

      return liveblog;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e === Status.Invalid) {
        erroMessage = `Invalid site (${Credentials.apiKey}) or live chat (${slug}) slugs.`;
      }

      throw new Error(erroMessage);
    }
  }
}
