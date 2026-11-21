# Pixel Memory

[![CI](https://github.com/lesegot-code/piximem/actions/workflows/ci.yml/badge.svg)](https://github.com/lesegot-code/piximem/actions/workflows/ci.yml)

Every picture holds a memory. Share the ones that matter most.


Pixel Memory is a photo sharing website. You post photos with captions and hashtags, collect them in albums, add friends and follow their activity. Moderators look after reported posts. It started as my IMY 220 project at the University of Pretoria (2026).

**Stack:** React 19, React Router, Tailwind CSS, Vite · Node.js, Express 5, MongoDB · Docker · GitHub Actions

## Features

**Accounts and profiles**
- Landing page with scroll effects (parallax photos, a sliding film strip, sections that fade in). It respects "reduce motion".
- Sign up and log in. Sessions use an httpOnly cookie and passwords are hashed with scrypt.
- Profiles show a name, username, pronouns, bio, location and website.
- Profile pictures can be dragged in. Without one you get a generated pixel avatar that is unique to you and can be shuffled.
- Privacy is enforced by the server: people who aren't your friends only see your name and picture.
- Verified accounts: you can ask once your account is over 7 days old and you have 2 posts and 5 comments. Admins approve or deny.

**Friends**
- Send, cancel, accept or decline friend requests, and unfriend.
- Mark friends as favourites so their posts show first in your feed.
- "People you may know" suggestions, ranked by mutual friends.
- Notifications for friend requests, accepted requests, verification results and removed posts.

**Posts and albums**
- Drag-and-drop photo upload with a caption and hashtags. Your most used hashtags are suggested.
- Edit the caption and hashtags of a post (the photo stays the same). Delete posts, and their comments go with them.
- Comment on posts, and delete comments.
- Albums can hold your own photos or friends' photos ("Save to album").
- Album hashtag suggestions come from the photos inside the album, most used first.
- Deleting the only photo in an album removes that album too.

**Feed and search**
- A friends feed and an everyone feed, made of posts plus album activity (for example "Kabelo added 1 photo to the album Weekend Drives").
- Sort by newest or most commented, filter by time (today, week, month) and by hashtag. These all combine.
- Search people (by name, username or email), posts, albums and hashtags.
- Search is fuzzy: it handles typos, unfinished words, swapped letters and sound-alikes ("elefant" finds elephants). Suggestions appear as you type.

**Moderation**
- Posts reported more than twice are hidden behind a notice that you can still open.
- The admin dashboard has reported posts with their reasons: keep the post or delete it, and the owner is notified.
- Admins can edit or delete any user, post or album, and manage the list of report reasons.
- Report abuse detection flags people whose reports keep getting dismissed, or who send 5 or more reports in a day. Admins can pause their reporting.

**Everywhere:** light and dark mode (it follows your system the first time), works from phone to desktop, and uses styled dialogs and toasts instead of browser alerts.

## Running it with Docker

1. Copy `backend/.env.example` to `backend/.env` and paste your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   In Atlas, open **Network Access** and allow your IP address (or `0.0.0.0/0`).
2. From the `app` folder, build and start both containers:
   ```
   cd app
   docker compose up -d --build
   ```
3. Fill the database with demo data. **This wipes the database.**
   ```
   docker compose exec backend npm run seed
   ```
4. Open http://localhost:5173

Useful commands:
```
docker compose logs -f backend               # watch the backend (connection status, errors)
docker compose exec backend npm run export   # save every collection to database/*.json
docker compose down                          # stop
```

## Running without Docker

```
cd backend && npm install && npm run seed && npm start      # http://localhost:3000
cd frontend && npm install && npm run dev                    # http://localhost:5173
```

The frontend forwards `/api` and `/uploads` to the backend (see `frontend/vite.config.js`). The browser only ever talks to one address, so the session cookie works without CORS. Inside Docker, the `API_TARGET` variable points the frontend at the `backend` container.

## Tests

There are three layers, and all of them run in GitHub Actions on every push and pull request.

| Layer | What it checks | Command |
| --- | --- | --- |
| Unit tests (`backend/test/unit.test.js`) | Fuzzy search, hashtags, ids, password hashing, Cloudinary signing | `cd app/backend && npm run test:unit` |
| API tests (`backend/test/api.test.js`) | The real Express app against a real MongoDB: sessions, privacy, friends, posts, albums, feed filters, search, verification, admin, cascading deletes | `npm run test:api` |
| End-to-end tests (`frontend/e2e/`) | Playwright in Chrome, desktop and phone sizes: every main flow, plus no console errors and no sideways scrolling | `cd app/frontend && npm run test:e2e` |

The API and end-to-end tests **wipe the database they use**, so give them their own database name:

```
# a local MongoDB works well: docker run -d -p 27017:27017 mongo:7
export MONGODB_URI=mongodb://localhost:27017
export MONGODB_DB=piximem_test
cd app/backend && npm test
cd ../frontend && npx playwright install chromium && npm run test:e2e
```

Playwright starts the backend and frontend itself and seeds the test database first.

## CI/CD

`.github/workflows/ci.yml` runs four jobs on every push and pull request:

1. **Frontend:** `npm ci`, lint, production build
2. **Backend:** unit and API tests against a MongoDB 7 service container
3. **End-to-end:** Playwright against the real backend, frontend and MongoDB. Its report is uploaded when something fails.
4. **Docker:** builds the development images and the production image, then starts the production image and checks that it serves the site

## Production build (ready for hosting later)

The site isn't hosted yet, but it's ready to be. `app/Dockerfile` builds a single production image in which the backend serves the built React app (one address, no CORS):

```
cd app
docker build -t pixel-memory .
docker run -p 3000:3000 --env-file backend/.env pixel-memory     # http://localhost:3000
```

`render.yaml` describes a Render web service that deploys `main` only after CI passes. When the app is hosted, setting `CLOUDINARY_URL` stores uploaded photos in Cloudinary instead of on the server's disk.

## Demo accounts

Every password is `test1234`.

| Email | What it shows |
| --- | --- |
| test@test.com | Main test user: 3 friends, posts, albums, 2 pending friend requests, can request verification |
| admin@test.com | Admin: the moderation dashboard |
| ditshego@test.com | Has a pending verification request; a favourite of the test user |
| kabelo@test.com | Verified account, owns the reported post |
| tshilidzi@test.com | Not friends with the test user (shows the private profile view) |
| sipho@test.com | Flagged for report abuse |

## Project structure

```
backend/
  server.js          app setup, routes, error handler, startup (listens first, retries MongoDB)
  db.js              the only place that connects to MongoDB
  lib/               sessions + passwords, helpers, deletes that cascade, fuzzy search, uploads
  routes/            auth, users, friends, posts, albums, feed, search, notifications, admin
  scripts/           seed.js (demo data), export-db.js (JSON export)
  seed-images/       demo photos, copied into uploads/ on start
frontend/
  index.html         the only HTML file
  public/            favicon, logo, landing page images
  src/
    api.js           every request to the backend
    context/         auth (session), theme, ui (toasts, confirm dialogs, share form)
    components/      reusable pieces (PostCard, AlbumCard, PhotoGrid, forms, modals, admin panels)
    pages/           one file per page
    utils/           hashtag and date helpers
docker-compose.yml
```

## API overview

All routes are under `/api` and need a session except the `auth` ones.

| Route | Purpose |
| --- | --- |
| `POST auth/signup`, `auth/login`, `auth/logout`, `GET auth/me` | Sessions |
| `GET users/:id/profile`, `PUT/DELETE users/:id`, `POST users/:id/favourite` | Profiles |
| `POST friends/:id/request \| accept \| decline \| cancel`, `DELETE friends/:id` | Friends |
| `GET feed?scope=&sort=&range=&tag=&page=`, `GET feed/hashtags` | Activity feed |
| `GET/POST posts`, `PUT/DELETE posts/:id`, `POST posts/:id/comments \| report` | Posts |
| `GET/POST albums`, `PUT/DELETE albums/:id`, `POST albums/:id/posts` | Albums |
| `GET search?q=`, `GET search/suggest?q=` | Search |
| `/admin/*` | Moderation (admins only) |
