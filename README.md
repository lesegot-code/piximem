# Pixel Memory

Every Picture Holds a Memory. Share the Ones That Matter Most.

## IMY220 Project 2026

A modern photo-sharing social platform where users can share and organize memories through photographs, albums, hashtags and activity feeds.

## Frontend
```
docker build -t photoshare-frontend ./frontend
docker run -p 5173:5173 --rm photoshare-frontend
```

## Backend
```
docker build -t photoshare-backend ./backend
docker run -p 3000:3000 --rm photoshare-backend
```
