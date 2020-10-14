import { ChatRoom, BasePolls, Poll, PollFilter } from '@arena-im/chat-types';
import { RealtimeAPI } from '../services/realtime-api';

export class Polls implements BasePolls {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentPolls: Poll[] = [];

  public constructor(private chatRoom: ChatRoom) {
    this.realtimeAPI = new RealtimeAPI(chatRoom._id);
  }

  public async loadPolls(filter?: PollFilter, limit?: number): Promise<Poll[]> {
    try {
      const polls = await this.realtimeAPI.fetchAllPolls(filter, limit);

      this.updateCacheCurrentPolls(polls);

      return this.cacheCurrentPolls;
    } catch (e) {
      throw new Error(`Cannot load polls on "${this.chatRoom._id}" chat channel.`);
    }
  }

  /**
   * Update the cache of current polls
   *
   * @param polls
   */
  private updateCacheCurrentPolls(polls: Poll[]): void {
    this.cacheCurrentPolls = polls;
  }
}
