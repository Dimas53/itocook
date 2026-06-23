from fastapi import FastAPI
from pydantic import BaseModel
import os
import requests
from pywebpush import webpush, WebPushException

app = FastAPI(
    title="ItoCook API",
    description="Microservice for calculations and business logic of ItoCook",
    version="0.1.0",
)

VAPID_PRIVATE_KEY = os.environ["VAPID_PRIVATE_KEY"]
VAPID_PUBLIC_KEY = os.environ["VAPID_PUBLIC_KEY"]
VAPID_SUBJECT = os.environ["VAPID_SUBJECT"]
DIRECTUS_URL = os.environ.get("DIRECTUS_URL", "http://directus:8055")
DIRECTUS_ADMIN_EMAIL = os.environ["DIRECTUS_ADMIN_EMAIL"]
DIRECTUS_ADMIN_PASSWORD = os.environ["DIRECTUS_ADMIN_PASSWORD"]


class PushRequest(BaseModel):
    user_ids: list[str]
    title: str
    body: str
    url: str = '/'


def get_admin_token() -> str:
    resp = requests.post(
        f"{DIRECTUS_URL}/auth/login",
        json={"email": DIRECTUS_ADMIN_EMAIL, "password": DIRECTUS_ADMIN_PASSWORD},
    )
    resp.raise_for_status()
    return resp.json()["data"]["access_token"]


def send_push(subscription: dict, title: str, body: str, url: str = '/') -> bool:
    try:
        print(f"[push] sending to {subscription['endpoint'][:60]}")
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth": subscription["auth"],
                },
            },
            data=__import__("json").dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT},
        )
        print(f"[push] OK")
        return True
    except WebPushException as e:
        print(f"[push] FAILED: {e}")
        return False
    except Exception as e:
        print(f"[push] ERROR: {e}")
        return False


@app.get("/")
def root():
    return {"message": "ItoCook API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "itocook-api"}


@app.post("/send-push")
def send_push_notification(req: PushRequest):
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    sent = 0
    failed = 0

    for user_id in req.user_ids:
        resp = requests.get(
            f"{DIRECTUS_URL}/items/push_subscriptions",
            headers=headers,
            params={"filter[user][_eq]": user_id},
        )
        if not resp.ok:
            continue

        subscriptions = resp.json().get("data", [])
        for sub in subscriptions:
            ok = send_push(
                {"endpoint": sub["endpoint"], "p256dh": sub["p256dh"], "auth": sub["auth"]},
                req.title,
                req.body,
                req.url,
            )
            if ok:
                sent += 1
            else:
                failed += 1

    return {"sent": sent, "failed": failed}
