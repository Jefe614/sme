#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
until nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

python sme_school_app/manage.py migrate --noinput
python sme_school_app/manage.py runserver 0.0.0.0:8000
