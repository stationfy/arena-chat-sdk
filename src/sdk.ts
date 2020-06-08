import { RealtimeAPI } from './services/realtime-api';
import { ChatMessage } from './types/chat-message';

/**
 * Chat SDK Client
 *
 * To use this SDK, call the {@link init} function as early as possible when
 * loading the web page.
 *
 * @example
 *
 * ```
 *
 * import { init } from '@arenaim/arena-chat-sdk';
 *
 * init('API_KEY')
 *```
 */
export function init(apiKey: string): void {
  console.log(apiKey);

  const realTimeApi = new RealtimeAPI('5ecfbf0a9d9da700083cef61');

  realTimeApi.listenToMessage((data: ChatMessage[]) => {
    console.log(data);
    console.log('hey!');
  }, 15);
}
