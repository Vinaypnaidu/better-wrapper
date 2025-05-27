from setuptools import setup, find_packages

setup(
    name='backend',
    version='0.1.0',
    packages=find_packages(include=["app*"]),
    install_requires=[
        'fastapi',
        'uvicorn',
        'openai',
        'python-dotenv',
        'sqlalchemy',
        'psycopg2-binary',  # PostgreSQL adapter
        'alembic',          # For database migrations
    ],
    entry_points={
        'console_scripts': [],
    },
) 