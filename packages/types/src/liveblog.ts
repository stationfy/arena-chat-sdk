export interface ILiveblogInfo {
  adsIsEnabled: boolean;
  autoPlayByPlay: boolean;
  autoPostConversionCards: {
    enabled: boolean;
    deliveryType: string;
    distribution: string;
    frequency: string;
    cards: string[];
  };
  autoScore: boolean;
  chatId: string;
  chatPosition: string;
  chatRoom: boolean;
  chatType: string;
  commentIsEnabled: boolean;
  createdAt: number;
  description: string;
  infoTab: boolean;
  isFirestore: boolean;
  key: string;
  language: string;
  liveblogLayout: string;
  location: string;
  modifiedAt: number;
  name: string;
  officialEvent: IOfficialEvent;
  officialTournamentId: string;
  pagination: number;
  presenceId: string;
  reactionType: string;
  scoreBar: boolean;
  scores: IScore[];
  share: boolean;
  showEventTitle: boolean;
  siteId: string;
  slug: string;
  soundAlert: boolean;
  sport: {
    actions: ISportAction;
    category: string;
    icon: string;
    id: string;
    key: string;
    name: string;
    periods: {
      name: string;
      total: string;
    };
    positions: {
      [key: string]: {
        key: string;
        name: string;
      };
    };
    scoreType: string;
    time: boolean;
  };
  startDate: number;
  status: string;
  statusBar: boolean;
  streamPin: string;
  streams: string[];
  summaryWordEvent: string;
  tags: string[];
  timeTitleColor: string;
  voting: boolean;
}

interface IOfficialEvent {
  awayScore: string;
  competitors: {
    abbreviation: string;
    country: string;
    countryCode: string;
    externalId: string;
    foxSportsAuId: string;
    id: string;
    image: string;
    lastUpdate: string;
    name: string;
    qualifier: string;
    sport: string;
    tournaments: string[];
    _id: string;
  }[];
  externalId: string;
  externalSeasonId: string;
  homeScore: string;
  lastUpdate: string;
  lineUpImported: true;
  scheduled: string;
  sport: string;
  status: string;
  title: string;
  tournamentExternalId: string;
  venue: {
    cityName: string;
    countryCode: string;
    id: string;
    name: string;
  };
  cityName: string;
  countryCode: string;
  id: string;
  name: string;
  _id: string;
}

interface IScore {
  event: string;
  id: string;
  matchId: string;
  summary: string;
  teamA: IScoreTeam;
  teamB: IScoreTeam;
}

interface IScoreTeam {
  abbreviation: string;
  cricketScore: number;
  id: string;
  image: string;
  name: string;
  score: number;
  set1: number;
  set2: number;
  set3: number;
  set4: number;
  set5: number;
}

interface ISportAction {
  [key: string]: {
    i18n: {
      'en-us': string;
      'pt-br': string;
    };
    icon: string;
    key: string;
    label: string;
    value: string;
  };
}
