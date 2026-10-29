# Pixel Memory

Every Picture Holds a Memory. Share the Ones That Matter Most.

## IMY220 Project 2026

A modern photo-sharing social platform where users can share and organize memories through photographs, albums, hashtags and activity feeds.

## Frontend

### Running locally
```
npm install
npm run dev
```
The app runs on http://localhost:5173. 

The backend must be running on
http://localhost:3000.

### Running with Docker
From the project root: `app/`
```
docker compose up -d --build
```
Frontend on http://localhost:5173. 

Backend on http://localhost:3000.

### Running individually
```
docker build -t photoshare-frontend ./frontend
docker run -p 5173:5173 --rm photoshare-frontend
```
### Test account
- email:    test@test.com
- password: test1234

## Backend

### Running locally
```
npm install
```
- only once - wipes DB and inserts demo data, run:
```
npm run seed 
```
- then start:
```
npm start
```
Backend runs on http://localhost:3000.

### Running individually
```
docker build -t photoshare-backend ./backend
docker run --env-file ./backend/.env -p 3000:3000 --rm photoshare-backend
```

## Uploaded images
Uploaded images go into `backend/uploads/` and are served at
`http://localhost:3000/uploads/<filename>`. 

In Docker, this folder is backed by
the `uploads-data` named volume, so files persist across `docker compose down`
(but are wiped by `docker compose down -v`).

## Seeding
`npm run seed` inserts:
- 8 users (including admin@test.com)
- 10 posts
- 5 albums
- Friendships + 1 pending request
- 1 post reported 3 times (for the "hidden from feed" demo)

Test account: `test@test.com` / `test1234`.
