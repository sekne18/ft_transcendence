# ft_transcendence
Full-Stack App showcasing Pong game with user authentication, etc.

# DEV SETUP GUIDE:
make sure you are using version 22.15.0 of node
## setting up the backend:
```
cd backend
```
generate the keys for JWT tokens
``` 
chmod +x backend/keygen.sh
./backend/keygen.sh
```
install packages & run the backend
```
npm i
npm run dev
```
set up ./backend/.env:
```
GOOGLE_CLIENT_ID=${your client id}
GOOGLE_CLIENT_SECRET=${your client secret}
GOOGLE_REDIRECT_URI=/api/login/google/callback
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```
## setting up the frontend
```
cd frontend
```
install packages & run the frontend
```
npm i
npm run dev
```
You are ready to go! browse to ``http://localhost:5173/``

# PROD SETUP GUIDE:
in ./backend/src/server.js line 32: make sure these values are set
```
const cookieOptions: { httpOnly: boolean, secure: boolean, sameSite: "strict" | "lax" | "none" } = {
	httpOnly: true,
	secure: true, // <-- Set to true in production (requires HTTPS)
	sameSite: 'strict',
};
```
in ./frontend/scripts/wsConfig.ts: make sure this is set
```
export const wsConfig: {
	scheme: "wss" | "ws",
	host: string,
} = {
	scheme: "wss", // "ws" in dev, "wss" in prod
	host: window.location.host, // "localhost:3000" in dev, window.location.host in prod
}
```
set up .env:
```
GOOGLE_CLIENT_ID=${your client id}
GOOGLE_CLIENT_SECRET=${your client secret}
GOOGLE_REDIRECT_URI=/api/login/google/callback
FRONTEND_URL=https://${server ip (host)}:8443
BACKEND_URL=https://${server ip (host)}:8443
```

note that google oauth might not work depending on whether you're using a domain name or not
(you also have to add the BACKEND_URL / domain + GOOGLE_REDIRECT_URI to the valid redirects in google console)


Now you are ready to go! browse to ``https://${server ip (host)}:8443/``