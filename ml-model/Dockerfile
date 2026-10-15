FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py fire_model.pkl flood_model.pkl ./
CMD gunicorn --bind 0.0.0.0:${PORT:-5000} app:app
