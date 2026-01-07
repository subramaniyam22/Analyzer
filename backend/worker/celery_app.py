from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Get Redis URL from environment
redis_url = os.getenv("REDIS_URL")

if not redis_url:
    print("WARNING: REDIS_URL not set, using default localhost")
    redis_url = "redis://localhost:6379/0"

# Render's Redis URL might need SSL for external connections
# Internal connections use redis:// format
print(f"Celery connecting to Redis: {redis_url[:30]}...")

celery_app = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Add broker connection retry settings
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10,
    # Memory optimization settings
    worker_prefetch_multiplier=1,  # Don't prefetch tasks (saves memory)
    task_acks_late=True,  # Acknowledge after task completes
    worker_max_tasks_per_child=5,  # Restart worker after 5 tasks to free memory
)

celery_app.autodiscover_tasks(["worker.tasks"])
