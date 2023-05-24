import { datadogLogs, StatusType } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { Env } from '@arena-im/chat-types';

import {
  DD_LOGS_CLIENT_TOKEN,
  DD_LOGS_SESSION_SAMPLE_RATE,
  DD_RUM_APLICATION_ID,
  DD_RUM_CLIENT_TOKEN,
  DD_RUM_DEFAULT_PRIVACY_LEVEL,
  DD_RUM_REPLAY_SAMPLE_RATE,
  DD_RUM_SESSION_SAMPLE_RATE,
  DD_RUM_TRACK_LONG_TASKS,
  DD_RUM_TRACK_RESOURCES,
  DD_RUM_TRACK_USER_INTERACTIONS,
  DD_SERVICE,
  DD_SITE,
  ENV,
} from '../config';

export class Logger {
  static _instanceLogger: Logger;
  currentEnv: Env = ENV;

  constructor() {
    datadogLogs.init({
      clientToken: DD_LOGS_CLIENT_TOKEN,
      site: DD_SITE,
      forwardErrorsToLogs: true,
      sessionSampleRate: DD_LOGS_SESSION_SAMPLE_RATE,
      service: DD_SERVICE,
      env: ENV,
    });

    datadogRum.init({
      applicationId: DD_RUM_APLICATION_ID,
      clientToken: DD_RUM_CLIENT_TOKEN,
      site: DD_SITE,
      service: DD_SERVICE,

      // Specify a version number to identify the deployed version of your application in Datadog
      // version: '1.0.0',
      sessionSampleRate: DD_RUM_SESSION_SAMPLE_RATE,
      sessionReplaySampleRate: DD_RUM_REPLAY_SAMPLE_RATE,
      trackUserInteractions: DD_RUM_TRACK_USER_INTERACTIONS,
      trackResources: DD_RUM_TRACK_RESOURCES,
      trackLongTasks: DD_RUM_TRACK_LONG_TASKS,
      defaultPrivacyLevel: DD_RUM_DEFAULT_PRIVACY_LEVEL,
      env: ENV,
    });

    if (DD_RUM_REPLAY_SAMPLE_RATE) {
      datadogRum.startSessionReplayRecording();
    }
  }

  static get instance(): Logger {
    if (!Logger._instanceLogger) {
      Logger._instanceLogger = new Logger();
    }

    return Logger._instanceLogger;
  }

  log(level: StatusType, message: string, messageContext?: Record<string, unknown>): void {
    if (level === 'warn' || level === 'error') {
      datadogLogs.logger.log(message, messageContext, level);
    } else if (this.currentEnv !== 'prd') {
      console[level](message, messageContext, level);
    }
  }
}
