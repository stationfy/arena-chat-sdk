---
sidebar_position: 7
---

# Analytics

Analytics helps you measure your users, product, and business. It unlocks insights into your app's funnel, core business metrics, and whether you have product-market fit.

### Step 1: Install the Analytics SDK

Installing the Analytics SDK is simple if you’re familiar with using external libraries or SDKs. To install the Analytics SDK using `Gradle`, add the following lines to a `build.gradle` file at the app level.

```js
repositories {
  mavenCentral()
}

dependencies {
  implementation 'im.arena:analytics:1.21.1'
}
```

### Step 2: Configure ProGuard to shrink code and resources

When you build your APK with minifyEnabled true, add the following line to the module's ProGuard rules file.

```js
-keep class im.arena.analytics.** { *; }
-keep class im.arena.commons.** { *; }
-keep class com.google.firebase.iid.** { *; }
```

### Step 3 : Setup SDK

The `Analytics.configure()` method must be called once across your Android client app. It is recommended to initialize the in the onCreate() method of the Application instance.

```js
Analytics
  .environment(Environment.PRODUCTION)
  .logLevel(LogLevel.NONE)
  .configure(CONTEXT, WRITE_KEY)
```

- `CONTEXT`: Base class for maintaining global application state.
- `WRITE_KEY`: The write key is the one used to initialize the SDK and will be provided by Arena team

The analysis service offers some types of metrics:

#### TRACK

The `track()` call is how you record any actions your users perform, along with any properties that describe the action.

Each action is known as an event. Each event has a name, like Subscribed, and properties, for example a Subscribed event might have properties like plan or couponCode

```js
Analytics.instance().track("Post Reacted", 
  hashMapOf<String, String>().apply {
    put("postId", "WOR06DvfpcRaylQJoZe")
    put("reaction", "thumbs_up")
})
```

- `EVENT`: The name of the event
- `PROPERTIES`: Additional properties that can be sent together with the event

#### PAGE

The `page()` call is how you register the screens that your users see, along with the properties that describe the action.

```js
Analytics.instance().page("Home", 
  hashMapOf<String, String>().apply {
    put("postId", "WOR06DvfpcRaylQJoZeu")
    put("reaction", "thumbs_up")
})
```

- `SCREEN`: The name of the screen that was viewed
- `PROPERTIES`: Additional properties that can be sent together with the event

#### IDENTIFY

`identify()` lets you tie a user to their actions and record traits about them. It includes a unique User ID and any optional traits you know about them like their email, name, etc.

We recommend to call identify in these situations:

- After a user registers or log in
- When a user updates their info
- After loading a page that is accessible by a logged in user

```js
Analytics.instance().identify("43564gfdrtysdg34234", 
  hashMapOf<String, String>().apply {
    put("name", "John Doe")
    put("email", "john@nocompany.com")
    put("plan", "business")
})
```

- `USER_ID`: Unique User ID
- `TRAITS`: Optional traits you know about them like their email, name, etc.