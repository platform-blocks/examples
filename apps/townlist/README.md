# Townlist

A Craigslist-style classifieds example built with plocks and Expo. Pick an area from a searchable city list grouped by region, with nearby areas and a search radius. Browse categories and subcategories into filtered results with list and gallery views, price, photo, and date filters, sorting, and saved searches. Each post opens its own page with a photo gallery and Lightbox, price, neighborhood, posted and updated times, attributes, a drawn approximate-location map, and reply, favorite, hide, flag, and share actions. Messages holds sample buying and selling conversations with a thread view. Posting is a six-step Stepper flow: type, category, area, category-specific details, images (a FileInput drop zone or bundled sample photos, with reorder and remove), and a review before publishing. All areas, listings, and people are fictional. Posts, favorites, hidden posts, saved searches, and messages are saved with AsyncStorage; nothing leaves the device and no account or backend is required.

Demo photos are bundled locally. The bicycle photo is from [Unsplash](https://unsplash.com/photos/tG36rvCeqng); the other photos and credits are shared with the [Idea Grid demo](../idea-grid/README.md).

Run from the plocks root:

```bash
npm install
npm run web -w @plocks/townlist
```
