# Better Wrapper

## Project Structure

```
better-wrapper/
├── backend/         # FastAPI backend code
│   ├── app/         # FastAPI application code (routers, models, etc.)
│   ├── setup.py     # Backend Python package setup
│   └── ...
├── frontend/        # Next.js + Tailwind frontend code
│   ├── src/app/     # Main Next.js app directory
│   └── ...
├── README.md
└── ...
```

## Backend Setup (FastAPI)

1. **Create and activate the conda environment:**

```bash
conda create -n summer python=3.13.2 -y
conda activate summer
```

2. **Install backend dependencies in editable mode:**

```bash
cd backend
pip install -e .
```

3. **Database Setup (PostgreSQL):**

   - Install PostgreSQL if not already installed:
     ```bash
     # Ubuntu/Debian
     sudo apt update
     sudo apt install postgresql postgresql-contrib

     # macOS with Homebrew
     brew install postgresql
     ```

   - Start PostgreSQL service:
     ```bash
     # Ubuntu/Debian
     sudo service postgresql start

     # macOS with Homebrew
     brew services start postgresql
     ```

   - Create a database:
     ```bash
     sudo -u postgres psql
     ```

     Then in the PostgreSQL prompt:
     ```sql
     CREATE DATABASE chat_app;
     CREATE USER postgres WITH PASSWORD 'postgres';
     GRANT ALL PRIVILEGES ON DATABASE chat_app TO postgres;
     \q
     ```

4. **Environment Configuration:**

   - Create a `.env` file in the `backend` directory:
     ```bash
     cd backend
     touch .env
     ```

   - Add the following content to your `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key
     OPENAI_MODEL=gpt-3.5-turbo
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chat_app
     ```

   - Replace `your_openai_api_key` with your actual OpenAI API key. You can obtain one from [OpenAI's platform](https://platform.openai.com/api-keys).

   - If you've used different database credentials, update the `DATABASE_URL` accordingly using the format:
     ```
     DATABASE_URL=postgresql://username:password@host:port/database_name
     ```

5. **Run the FastAPI development server:**

```bash
cd backend
uvicorn app.main:app --reload
```

6. **Add new dependencies:**

- Add new packages to the `install_requires` list in `backend/setup.py`.
- Run `pip install -e .` again inside the `backend` directory to update the environment.

---

## Frontend Setup (Next.js + Tailwind)

1. **Install frontend dependencies:**

```bash
cd frontend
npm install
```

2. **Run the Next.js development server:**

```bash
npm run dev
```

3. **Open your browser and visit:**

```
http://localhost:3000
```

You should see a basic chat UI. Type a message and you'll get a static response ('Hello!').