# Arena Chat SDK

arena-chat-sdk is the official JavaScript client for Arena Chat, a service for building chat applications.

You can sign up for a Arena account at https://dashboard.arena.im/.

### Installation

#### Install with NPM

```bash
npm install arena-chat-sdk
```

#### Install with Yarn

```bash
yarn add arena-chat-sdk
```

#### Using JS deliver

```html
<script src="https://cdn.jsdelivr.net/npm/arena-chat-sdk"></script>
```

### Example
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Chat</title>
  </head>
  <body>
    <script src="bundle.js"></script>
    <script>
      (async function () {
        var arenaChat = new ArenaChat(SITE_SLUG);
        const channel = await arenaChat.getChannel(CHAT_SLUG);

        channel.sendMessage('my first chat message').then(() => {
          console.log('sent!');
        });
      })();
    </script>
  </body>
</html>
```

### API Documentation

Documentation for this JavaScript client are available at the [Arena website](https://arena.im)

### More

- [Logging](docs/logging.md)
- [User Token](docs/userToken.md)
