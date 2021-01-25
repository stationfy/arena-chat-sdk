export interface BaseRemindMe {
  fetchReminderSubscribe(reminderId: string): Promise<boolean>;
  subscribeRemindMe(reminderId: string): Promise<boolean>;
  unsubscribeRemindMe(reminderId: string): Promise<boolean>;
}
