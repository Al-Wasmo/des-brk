# des-brk-backend

FastAPI backend for:
- searching/downloading images through `des-brk-micro/scrape-designs/scrape-content.py`,
- storing image results,
- storing context selections,
- storing basic conversations/messages.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Endpoints

- `GET /health`
- `POST /api/v1/images/search` body: `{ "topic": "food app" }`
- `GET /api/v1/images?topic=food%20app`
- `GET /api/v1/context`
- `POST /api/v1/context` body: `{ "image_asset_id": 1 }`
- `DELETE /api/v1/context/{context_item_id}`
- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/{conversation_id}/messages`
- `POST /api/v1/conversations/{conversation_id}/messages`
- `POST /api/v1/reverse-design/run` body: `{ "image_asset_ids": [1,2], "prompt": "steps..." }`
