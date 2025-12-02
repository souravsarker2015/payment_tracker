"""
Timezone configuration for the application
"""
from datetime import datetime, timezone
import pytz

# Application timezone
TIMEZONE = pytz.timezone('Asia/Dhaka')

def now_dhaka():
    """Get current datetime in Dhaka timezone"""
    return datetime.now(TIMEZONE)

def make_aware(dt: datetime):
    """Convert naive datetime to Dhaka timezone-aware datetime"""
    if dt.tzinfo is None:
        return TIMEZONE.localize(dt)
    return dt.astimezone(TIMEZONE)

def make_naive(dt: datetime):
    """Convert timezone-aware datetime to naive datetime in Dhaka timezone"""
    if dt.tzinfo is not None:
        return dt.astimezone(TIMEZONE).replace(tzinfo=None)
    return dt

def utc_to_dhaka(dt: datetime):
    """Convert UTC datetime to Dhaka timezone"""
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(TIMEZONE)
