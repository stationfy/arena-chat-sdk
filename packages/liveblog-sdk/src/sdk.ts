import { Status } from '@arena-im/chat-types';
import { Credentials } from '@arena-im/core';
import { Liveblog } from './liveblog/liveblog';
import LiveConfig, { AreaProperties, EnvType } from '@arena-im/config-sdk';


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

  public constructor({apiKey, region = 'USA', envs} : { apiKey: string, region: AreaProperties, envs?: EnvType}) {
    LiveConfig.instance.region = region
    if(envs){
      console.log('Setando custom envs...', envs)
      LiveConfig.instance.enviroment = envs
    }
    console.log('\n\n\n LiveConfig constructor check...')
    console.log(LiveConfig.enviroment)
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n\n\n')
    Credentials.apiKey = apiKey;
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
