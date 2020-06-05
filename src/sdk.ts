import { RealtimeBaseAPI } from './services/realtime-base-api';
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

  const realTimeBaseApi = new RealtimeBaseAPI('5ecfbf0a9d9da700083cef61');

  realTimeBaseApi.listenToMessage((data: ChatMessage[]) => {
    console.log(data);
    console.log('hey!');
  }, 15);
}
