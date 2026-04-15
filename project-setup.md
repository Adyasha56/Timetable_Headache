# Project Setup (Folder Structure + Required Tech Stack Installation)

## 1) Folder Structure

```text
Headache_Solver/
├── architecture.md
├── project-setup.md
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── .env.local
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       ├── store/
│       └── utils/
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── modules/
│       ├── common/
│       └── integrations/
├── workers/
│   └── python/
│       ├── requirements.txt
│       └── app/
│           └── worker.py
├── infra/
│   ├── docker-compose.yml
│   └── redis/
└── docs/
```

## 2) Required Tech Stack Installation

## Windows prerequisites

1. Install Git
- Download: https://git-scm.com/download/win

2. Install Node.js LTS (for frontend + Express backend)
- Download: https://nodejs.org/en
- Verify:
```powershell
node -v
npm -v
```

3. Install Python 3.11+
- Download: https://www.python.org/downloads/
- Verify:
```powershell
python --version
pip --version
```

4. Install Docker Desktop (recommended for Redis and local infra)
- Download: https://www.docker.com/products/docker-desktop/
- Verify:
```powershell
docker --version
docker compose version
```

5. Redis
- Preferred: run with Docker
```powershell
docker run -d --name timetable-redis -p 6379:6379 redis:7-alpine
```

6. MongoDB Atlas
- Create Atlas cluster and user.
- Copy connection string for backend `.env`.

## Frontend installation (Next.js)

```powershell
cd frontend
npm install
npm run dev
```

## Backend installation (Express JS only)

```powershell
cd backend
npm install express cors helmet morgan dotenv
npm install -D nodemon
npm run dev
```

## Python worker installation

```powershell
cd workers/python
pip install -r requirements.txt
python app/worker.py
```

## 3) Required environment variables

### backend/.env

```env
NODE_ENV=development
PORT=8080
MONGODB_URI=<your_atlas_connection_string>
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=<your_anthropic_key>
```

### frontend/.env.local

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## 4) Minimal run order

1. Start Redis.
2. Start backend.
3. Start Python worker.
4. Start frontend.

## 5) Notes

- Backend is Express with JavaScript only.
- CP-SAT solving remains in Python workers.
- Daily override path should stay outside solver path.
