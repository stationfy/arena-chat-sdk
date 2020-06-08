import { ChatMessage } from './types/chat-message';
import { RestAPI } from './services/rest-api';
import { ChatRoom } from './types/chat-room';
import { Site } from './types/site';

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
export async function init(apiKey: string): Promise<void> {
  console.log(apiKey);

  const chatRoom: ChatRoom = {
    allowSendGifs: true,
    allowShareUrls: true,
    chatAutoOpen: false,
    chatClosedIsEnabled: false,
    chatPreModerationIsEnabled: true,
    chatPreviewEnabled: true,
    chatRequestModeratorIsEnabled: true,
    createdAt: 1590673162238,
    id: '5ecfbf0a9d9da700083cef61',
    lang: 'pt-br',
    language: 'pt-br',
    name: 'Sign up 2',
    presenceId: '-M8QVYunmG9FFwW955sj',
    reactionsEnabled: true,
    showOnlineUsersNumber: true,
    signUpRequired: false,
    signUpSettings: {
      suggest: true,
      type: 'SIGN_UP_NOT_REQUIRED',
    },
    siteId: '5e308d3468fd630008d02305',
    slug: 'twf1',
    standalone: true,
  };

  const site: Site = {
    id: '5e308d3468fd630008d02305',
    name: 'globoesporte',
  };

  const message: ChatMessage = {
    message: {
      text: 'hey!',
    },
    publisherId: '5e308d3468fd630008d02305',
    sender: {
      anonymousId: '111234',
      displayName: 'Kristin Mckinney',
      photoURL: 'https://randomuser.me/api/portraits/women/12.jpg',
    },
  };

  const restApi = new RestAPI(chatRoom, site);

  try {
    const response = await restApi.sendMessage(message);

    console.log({ response });
  } catch (e) {
    console.log('error: ', e);
  }
}
