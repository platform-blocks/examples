# Frameleaf

A photo sharing example built with plocks and Expo. Browse a feed, watch full-screen stories that auto-advance (tap left or right to skip), search Explore, check Activity, open your profile or anyone else's (follow, highlights, posts and tagged grids), and create a demo post. The ellipsis on posts, stories and profiles opens a bottom sheet of actions, and mobile navigation uses the plocks `BottomAppBar`. Multi-image posts use the Plocks Carousel; tapping a photo opens the Plocks Lightbox at that image. Likes, saves, comments, and posts are saved locally with AsyncStorage. The gallery uses bundled demo artwork; no account or backend is required.

Run from the plocks root:

```bash
npm install
npm run web -w @plocks/frameleaf
```
