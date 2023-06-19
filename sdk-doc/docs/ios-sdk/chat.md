---
sidebar_position: 3
---

# Chat

Arena provides a ready-to-use live group chat activity that doesn't require any development effort and it can power many of the common scenarios. For more complex use-cases we made available the Swift SDK that provides the infra-structure necessary to build your own chat experience and at the same time leverage the powerful moderation and backoffice tools available at the Arena Dashboard.

### Step 1: Setup SDK

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

You can find your site slug in the dashboard settings: [https://dashboard.arena.im/settings/site](https://dashboard.arena.im/settings/site).

To access the chat room slug, go to the [chat list page](https://dashboard.arena.im/chatlist), find the chat and take the last route param as in the example below:

![Initialize Example](/img/initialize-example.png "Initialize Example")

After retrieving the site slug and chat slug, it is necessary to call `ArenaChat.setup()`. The method must be called once across your client app. It is recommended to initialize the in the `application(_:didFinishLaunchingWithOptions:)method` of the `AppDelegate`.

```js
ArenaChat.setup(writeKey: "writeKey", channel: "slug", environment: .development)
```

- [writeKey](https://dashboard.arena.im/settings/site): Account identifier
- [channel](https://dashboard.arena.im/settings/site): Chat identifier
- environment: Environment that the Chat is running: .development or .production

### Step 2: Start Chat

To start the chat it is necessary to initiate the `ChatView`, add it as subview on your ViewController and call `startEvent()` as the exemple below:

```js
import UIKit
import ArenaChatSDK

class ViewController: UIViewController {
    private lazy var chatView: ChatView = {
        let view = ChatView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.addSubview(chatView)
        setupConstraints()

        chatView.startEvent()
    }
}
```

After these steps, the chat is up and running in your app.

### Step 3: Single Sign On

Chat allows the product to have its own SSO login flow. Users can enter the chat while logged in. You can start the chat with a logged in user, before `chatView.startEvent()`, just call:

```js
chatView.setUser(
    ExternalUser(id: "id",
                 name: "name",
                 email: "email@email.com",
                 image: "imageURL",
                 familyName: "familyName",
                 givenName: "givenName")
)
```

- `id`: unique user identifier.
- `name`: full username.
- `email`: user email.
- `image`: user profile picture url.
- `familyName`: the family's last user name.
- `givenName`: the user name.

For example:

```js
chatView.setUser(
    ExternalUser(id: "123123",
                 name: "Roberto Silva",
                 email: "roberto@gmail.com",
                 image: "https://randomuser.me/api/portraits/",
                 familyName: "Silva",
                 givenName: "Lima")
)
```

If the chat is started in incognito mode and the user chooses to login with SSO, it will be sent via delegate `ChatDelegate` on `func ssoUserRequired(completion: (ExternalUser) -> Void)`, indicating that you should start your login flow in the app.

```js
extension ViewController: ChatDelegate {
    func ssoUserRequired(completion: (ExternalUser) -> Void) {
        // do the login flow and call the completion in the end
        completion(
            ExternalUser(id: "123123",
                         name: "Roberto Silva",
                         email: "roberto@gmail.com",
                         image: "https://randomuser.me/api/portraits/",
                         familyName: "Silva",
                         givenName: "Lima")
        )
    }
}
```

Remember to initializate the `ChatView` passing the delegate, as in the example:

```js
  ChatView(delegate: self)
```