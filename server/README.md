Mailer server

1. Install dependencies

```bash
cd server
npm install
```

2. Create a `.env` with SMTP settings

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
FROM_EMAIL=FirstWitness <you@example.com>
```

3. Start the server

```bash
npm start
```

4. The front-end POSTs the PDF to `/api/send-email` (relative). If you run the server on a different port in development, proxy the request from the CRA dev server (see `package.json` proxy) or set the full URL in the front-end.
