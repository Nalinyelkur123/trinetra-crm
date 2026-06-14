# Environment Configuration

## Backend Setup

1. Create a `.env` file in the `backend` directory (copy from `.env.example`):
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the following in `backend/.env`:
   - `JWT_SECRET`: Generate a strong 32+ character secret key
   - `ADMIN_SEED_PASSWORD`: Set a secure password for initial admin account
   - `WORKER_SEED_PASSWORD`: Set a secure password for initial worker account

3. Generating a secure JWT secret:
   ```bash
   # macOS/Linux
   openssl rand -base64 32
   
   # Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. Never commit `.env` files to version control

## Frontend Setup

1. Create a `.env` file in the `frontend` directory (copy from `.env.example`):
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Update `VITE_API_URL` to match your backend server URL

## Development Workflow

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and update values
npm run seed  # Initialize database with seed data
npm run dev   # Start development server on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
# Copy .env.example to .env and update values
npm run dev   # Start development server on http://localhost:5173
```

## Production Considerations

- Always use strong, unique JWT secrets in production
- Never use default passwords
- Use environment-specific `.env` files
- Implement proper secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable HTTPS in production
- Implement rate limiting and CORS properly
- Use environment variables for all configuration
