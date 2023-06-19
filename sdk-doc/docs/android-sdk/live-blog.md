---
sidebar_position: 5
---

# Live Blog

Integrate the live blog in real time into your Android client applications with speed and efficiency. Our SDK helps you focus on the client's implementation of initializing, configuring and displaying the live blog. Displays all card types in live blog format. We currently support the following cards:

#### Card Title

![Card Title](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Title.png)

#### Description

![Description](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Description.png)

#### Title And Description

![Title And Description](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/TitleAndDescrption.png)

#### Publisher

![Publisher](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Publisher.png)

#### Pinned

![Pinned](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Pinned.png)

#### Sumary

![Sumary](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Summary.png)

#### Player/Person

![Player/Person](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/PlayerAndPerson.png)

#### Golf

![Golf](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Golf.png)

#### Article

![Article](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Article.png)

#### Social

![Social](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Social.png)

#### Video

![Video](https://raw.githubusercontent.com/stationfy/Arena-SDK-Android/master/showcase/Video.png)

### Step 1: Create a live blog from your dashboard

Ask your account manager for your publisher slug

### Step 2: Install the Live Blog SDK

Installing the Live Blog SDK is simple if you’re familiar with using external libraries or SDKs. To install the Live Blog SDK using `Gradle`, add the following lines to a `build.gradle` file at the app level.

```js
repositories {
  mavenCentral()
}

dependencies {
  implementation 'im.arena:liveblog:1.30.0'
}
```

### Step 3: Configure ProGuard to shrink code and resources

When you build your APK with minifyEnabled true, add the following line to the module's ProGuard rules file.

```js
-keep class im.arena.liveblog.** { *; }
-keep class im.arena.analytics.** { *; }
-keep class im.arena.commons.** { *; }
-keep class im.arena.realtimedata.** { *; }
```

### Step 4: Setup SDK

Initialization links the SDK to the Android context, allowing you to respond to connection and status changes. The LiveBlog.setup() method must be called once across your Android client app. It is recommended to initialize the in the onCreate() method of the Application instance.

```js
LiveBlog.configure(APPLICATION)
```

- `APPLICATION`: Base class for maintaining global application state.

### Step 5: Start SDK

To initialize the sdk it is necessary to add the LiveBlog in the xml:

```js
<im.arena.liveblog.LiveBlog 
  android:id="@+id/live_blog"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
/>
```

And start the event watcher by passing the following parameters:

```js
live_blog.start(PUBLISH_SLUG, EVENT_SLUG, LIFECYCLE_OWNER, CLICK_LISTENER)
```

- `PUBLISH`: The publisher slug will be provided by Arena.
- `EVENT_SLUG`: Live blog identifier
- `LIFECYCLE_OWNER`: A class that has an Android lifecycle. These events can be used by custom components to handle lifecycle changes without implementing any code inside the Activity or the Fragment.
- `CLICK_LISTENER`: Interface definition for a callback to be invoked when a view is clicked.
