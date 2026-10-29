# Threadit

A community discussion app built with plocks and Expo, laid out like a mobile forum app.

- **Home feed** with Home (your joined communities) and Popular tabs, Hot/New/Top sorting, and compact post cards with voting, comment counts, save and share.
- **Post pages** open as full screens with a back button, not modals. Each one shows the whole post and its threaded comments. You can sort comments by Best, Top or New. Replies nest with indent rails, and tapping a rail or a comment header collapses that thread. Comments have their own votes, an OP badge and relative timestamps. A reply composer puts each reply in the right place in the tree, and very deep threads end in "Continue this thread".
- **Community pages** (`t/name`) open from any community name. They show a banner, member and online counts, a Join button, an About section with rules, and the community's posts with sorting.
- **Bottom tabs:** Home, Communities (search and join), Create (pick a community, then write a text or image post), Inbox (notifications with unread badges) and You (karma, your posts, comments and saved posts). Search is in the home header.
- **Wide screens** replace the bottom tabs with a side nav. The feed sits in a centered column with a sidebar of community info on the right.

Seed data lives in `data.ts`. Your posts, comments, votes, saved posts, joined communities and read notifications are saved with AsyncStorage and stay on the device.

Run from the examples root:

```bash
npm install
npm run web -w @plocks/threadit
```
