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
    public static apiKey: string;
  
    public constructor(apiKey: string) {
        ArenaLiveblog.apiKey = apiKey;
    }
  }
  