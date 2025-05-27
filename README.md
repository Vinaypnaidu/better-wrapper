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

3. **Run the FastAPI development server:**

```bash
cd backend
uvicorn app.main:app --reload
```

4. **Add new dependencies:**

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