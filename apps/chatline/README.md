# Chatline

A messaging example built with plocks and Expo. Browse and search chats, filter unread and group conversations, open a chat, send messages, and view Updates and Calls. Demo conversations live on device; sent messages and read state are saved with AsyncStorage. No account, phone number, or network service is required.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/chatline
```

Use `npm run start -w @plocks/chatline` for Expo Go, or the `ios` and `android` scripts for local native builds.

The screen is in `App.tsx`; seed conversations, statuses, and call history are in `data.ts`. This is a local UI example: it does not send messages or place calls through an external service.
