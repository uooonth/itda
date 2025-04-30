FROM python:3.11.1-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV WATCHFILES_FORCE_POLLING=true

COPY ./backend/requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# COPY ./backend ./backend 
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000","--reload"]
