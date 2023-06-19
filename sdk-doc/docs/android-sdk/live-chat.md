---
sidebar_position: 6
---

# Live Chat

Arena provides a ready-to-use live group chat activity that doesn't require
any development effort and it can power many of the common scenarios.
For more complex use-cases we made available the Kotlin SDK that
provides the infra-structure necessary to build your own chat experience
and at the same time leverage the powerful moderation and backoffice
tools available at the Arena Dashboard.

### Step 1: Install the Chat SDK

Installing the Chat SDK is simple if you’re familiar with using external libraries or SDKs. To install the Chat SDK using `Gradle`, add the following lines to a `build.gradle` file at the app level.

```js
repositories {
  mavenCentral()
}

dependencies {
  implementation 'im.arena:chat:1.4.0'
}
```

### Step 2: Configure ProGuard to shrink code and resources

When you build your APK with minifyEnabled true, add the following line to the module's ProGuard rules file.

```js
-keep class im.arena.chat.** { *; }
-keep class im.arena.analytics.** { *; }
-keep class im.arena.commons.** { *; }
-keep class im.arena.realtimedata.** { *; }
```

### Step 3: Setup SDK

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

You can find your site slug in the dashboard settings: [https://dashboard.arena.im/settings/site](https://dashboard.arena.im/settings/site).

To access the chat room slug, go to the (chat list page)[https://dashboard.arena.im/chatlist], find the chat and take the last route param as in the example below:

![Initialize Example](/img/initialize-example.png "Initialize Example")

After retrieving the site slug and chat slug, it is necessary to call Chat.configure(). The method must be called once across your Android client app. It is recommended to initialize the in the onCreate() method of the Application instance.

```js
Chat.configure(application, writeKey, slug)
```

[APPLICATION](https://developer.android.com/reference/android/app/Application): Base class for maintaining global application state.
[WRITE_KEY](https://dashboard.arena.im/settings/site): Account identifier
[SLUG](https://dashboard.arena.im/settings/site): Chat identifier

The chat has additional settings that allow customers to be able to see the event logs on the terminal, as well as change the environment that is running:

```js
Chat
  .environment(environment)
  .logLevel(LogLevel.DEBUG)
  .configure(application, writeKey, slug)
```

### Step 4: Start Chat

To start the chat it is necessary to call:

```js
Chat.newInstance()
```

The chat internally extends Android's [Fragment](https://developer.android.com/guide/fragments), which allows customers to add and customize the screen on which the chat is embedded. For this, you need to add the chat to a view of your application, for example:

```js
supportFragmentManager
  .beginTransaction()
  .replace(R.id.container,fragment)
  .commitAllowingStateLoss()
```

After these steps, the chat is up and running in your app.

### Step 5: Singe Sign On

Chat allows the product to have its own SSO login flow. Users can now enter the chat while logged in. You can start the chat with a logged in user, just call:

```js
Chat.loggedUser(  
  ExternalUser(id, name, email, image, firstName, lastName)  
)
```

`id`: unique user identifier.
`name`: full username.
`email`: user email.
`image`: user profile picture.
`firstName`: user name.
`lastName`: your family's last name.

For example:

```js
Chat
  .loggedUser(
    ExternalUser("123123","Roberto", "roberto@gmail.com",
      "https://randomuser.me/api/portraits/women/","Silva","Lima"
    )
  )
```

If the chat is started in incognito mode and the user chooses to login with SSO, an event will be sent via [LiveData](https://developer.android.com/topic/libraries/architecture/livedata?hl=pt-br) with the value Events.SSO, indicating that you should start your login flow in the app.

```js
 private fun observeEvents() {
  Chat.liveDataEvents().observe(this) { events: Events ->
    when (events) {
      Events.SSO_REQUIRED -> {
        Chat.loggedUser(ExternalUser(id, name, email, image, firstName, lastName))
      }
    }
  }
}
```

