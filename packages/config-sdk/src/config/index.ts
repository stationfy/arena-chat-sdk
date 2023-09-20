
export type EnvType = {
    API_V2_URL? : string | undefined;
    CACHED_API? : string | undefined;
    DEFAULT_AUTH_TOKEN? : string | undefined;
    FIREBASE_APIKEY? : string | undefined;
    FIREBASE_AUTHDOMAIN? : string | undefined;
    FIREBASE_PROJECT_ID? : string | undefined;
    GRAPHQL_ENDPOINT? : string | undefined;
    ARENA_REALTIME_URL? : string | undefined;
    ARENA_URL? : string | undefined;
}

type EnvDataType = {
    EU: EnvType,
    USA: EnvType,
    LOCAL?: EnvType
}

export type AreaProperties =  'EU' | 'USA' | 'LOCAL';

export class Config {
    private static configInstance: Config;
    private static _enviroment: EnvType | null = null;
  
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    public static get instance(): Config {
        if (!Config.configInstance) {
          Config.configInstance = new Config();
        }
        Config.configInstance.region = 'USA';
        return Config.configInstance;
    }

    public set region(region: AreaProperties){
        const enviroments: EnvDataType={
            EU: {
                API_V2_URL: 'https://api.eu.arena.im/v2',
                CACHED_API: 'https://cached-api.eu.arena.im/v1',
                DEFAULT_AUTH_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGQ5OGJiNmY3MDIyOGU4MWI4Njc5YmUiLCJyb2xlcyI6WyJVU0VSIl0sImV4cCI6MzM2OTQxODM2OSwiaWF0IjoxNDc3MjU4MzY5fQ.dNpdrs3ehrGAhnPFIlWMrQFR4mCFKZl_Lvpxk1Ddp4o',
                FIREBASE_APIKEY: 'AIzaSyCdnt__-0U00CfHQu97gzAfub6j7rS3lQc',
                FIREBASE_AUTHDOMAIN: 'arena-eu-im-prd.firebaseapp.com',
                FIREBASE_PROJECT_ID: 'arena-eu-im-prd',
                GRAPHQL_ENDPOINT: 'https://public.eu.arena.im/graphql',
                ARENA_REALTIME_URL: 'https://realtime.eu.arena.im',
                ARENA_URL: 'https://go.eu.arena.im',
            }, 
            USA: {
                API_V2_URL: 'https://api.arena.im/v2',
                CACHED_API: 'https://cached-api.arena.im/v1',
                DEFAULT_AUTH_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGQ5OGJiNmY3MDIyOGU4MWI4Njc5YmUiLCJyb2xlcyI6WyJVU0VSIl0sImV4cCI6MzM2OTQxODM2OSwiaWF0IjoxNDc3MjU4MzY5fQ.dNpdrs3ehrGAhnPFIlWMrQFR4mCFKZl_Lvpxk1Ddp4o',
                FIREBASE_APIKEY: 'AIzaSyCQ6GusAUlKV7FQZDtKplQqpNjQWzE3inE',
                FIREBASE_AUTHDOMAIN: 'arena-im-prd.firebaseapp.com',
                FIREBASE_PROJECT_ID: 'arena-im-prd',
                GRAPHQL_ENDPOINT: 'https://public.arena.im/graphql',
                ARENA_REALTIME_URL: 'https://realtime.arena.im',
                ARENA_URL: 'https://go.arena.im',
            }
        }
        Config._enviroment = region === 'EU' ? enviroments.EU :  enviroments.USA; 
        console.log(Config._enviroment )
    }

    public set enviroment(envs: EnvType){
        Config._enviroment = envs;
    }

    public static get enviroment(): EnvType | null {
        return Config._enviroment;
    }
    
  }