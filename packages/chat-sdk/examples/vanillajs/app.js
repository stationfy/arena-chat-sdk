// create Arena Chat object with the site slug
var arenaChat = new window.ArenaChat({apiKey: YOUR_SITE_SLUG});

async function initialize() {
  // get a channel with chat slug
  const channel = await arenaChat.getChannel(YOUR_CHAT_SLUG);

  // receive recent messages
  const messages = await channel.loadRecentMessages(20);

  // render messages
  const container = document.querySelector('.messages');
  messages.forEach(message => {
    container.appendChild(getMessageEl(message));
  });
  container.scrollTop = container.scrollHeight;

  // set current user
  const user = {
    image: 'https://randomuser.me/api/portraits/women/56.jpg',
    name: 'Naomi Carter',
    id: 'tornado',
    email: 'naomi.carter@example.com',
  };

  await arenaChat.setUser(user);

  // watch new messages
  channel.onMessageReceived((message) => {
    container.appendChild(getMessageEl(message));
    container.scrollTop = container.scrollHeight;
  });

  // send message
  const sendButton = document.querySelector('.button--send');
  sendButton.addEventListener('click', async () => {
    const input = document.querySelector('.input input');
    const text = input.value;

    sendButton.innerText = 'Sending...';

    await channel.sendMessage(text);

    sendButton.innerText = 'Send';

    input.value = '';
  });
}

function getMessageEl (message) {
  const container = document.createElement('div');
  container.classList.add('message')

  container.appendChild(getAvatarEl(message.sender));
  container.appendChild(getTextEl(message.message));

  return container;
}

function getAvatarEl(sender) {
  const avatar = document.createElement('figure')
  avatar.classList.add('avatar')

  const avatarImg = document.createElement('img')
  avatarImg.src = sender.photoURL
  avatarImg.alt = 'Avatar'

  avatar.appendChild(avatarImg)

  return avatar;
}

function getTextEl(message) {
  const text = document.createElement('span');

  text.innerText = message.text;

  return text;
}

initialize()
