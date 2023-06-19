---
sidebar_position: 8
---

# RealTimeData

Using this mode you're controlling how the date will be displayed entirely on your side, we will provide a data stream with all information.

### Step 1: Install the RealTimeData SDK

Installing the RealTimeData SDK is simple if you’re familiar with using external libraries or SDKs. To install the RealTimeData SDK using `Gradle`, add the following lines to a `build.gradle` file at the app level.

```js
repositories {
  mavenCentral()
}

dependencies {
  implementation 'im.arena:realtimedata:1.40.0'
}
```

### Step 2: Configure ProGuard to shrink code and resources

When you build your APK with minifyEnabled true, add the following line to the module's ProGuard rules file.

```js
-keep class im.arena.realtimedata.** { *; }
```

### Step 3 : Setup SDK

Initialization links the SDK to the Android context, allowing you to respond to connection and status changes. The `RealTimeData.setup()` method must be called once across your Android client app. It is recommended to initialize the in the `onCreate()` method of the Application instance.

```js
RealTimeData
  .environment(Environment.PRODUCTION)
  .logLevel(LogLevel.NONE)
  .configure(CONTEXT)
```

- `CONTEXT`: Base class for maintaining global application state.

The real time data service offers some alternatives for customers to consume data:

#### REALTIME

Real time data listener

```js
RealTimeData
  .playByPlay
  .realtime(QUERY,
    { success->
    },
    { error->
    })
```

- `QUERY`: Query to request the information provided through the method `RealTimeData.playByPlay.query(EVENT_KEY)`
- `PER_PAGE`: Number of items per page

The return of this call is the `ListenerRegistration` which can be used later to cancel the real time data stream by calling `listenerRegistration.remove()`

#### QUERY

Build the query to retrieve the data.

```js
RealTimeData.playByPlay.query(EVENT_KEY, PRIORITY, ORDER_BY, PER_PAGE, QUERY_INFO)
```

- `EVENT_KEY`: Event identifier
- `PRIORITY`: The priority in which elements should be returned: ASCENDING or DESCENDING
- `ORDER_BY`: The order in which elements should be returned: NEWEST or OLDEST
- `PER_PAGE`: Number of items per page
- `QUERY_INFO`: The type of query to be performed. We currently only offer PLAY_BY_PLAY

Returns a Query object containing the information needed to perform a real-time or just a single query