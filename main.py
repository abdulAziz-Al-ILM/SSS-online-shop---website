import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from database_web import get_all_active_products, get_company_info

app = FastAPI(title="ILM Construction Web API")

# Papkalarni yaratish mantiqi
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("static/img", exist_ok=True)
os.makedirs("templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

BOT_TOKEN = os.getenv("BOT_TOKEN")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    info = await get_company_info()
    return templates.TemplateResponse("index.html", {"request": request, "info": info})

@app.get("/api/products")
async def api_get_products():
    products = await get_all_active_products()
    return {"status": "success", "data": products}

# Telegram rasmlarini saytga o'tkazib beruvchi ko'prik
@app.get("/api/image/{file_id}")
async def get_telegram_image(file_id: str):
    try:
        async with httpx.AsyncClient() as client:
            file_info_res = await client.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getFile?file_id={file_id}")
            file_info = file_info_res.json()
            
            if not file_info.get("ok"):
                return {"error": "Rasm topilmadi"}
            
            file_path = file_info["result"]["file_path"]
            file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
            
            req = client.build_request("GET", file_url)
            r = await client.send(req, stream=True)
            return StreamingResponse(r.aiter_raw(), media_type="image/jpeg")
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/order")
async def api_create_order(order_data: dict):
    # Bu yerda buyurtma mantiqi
    return {"status": "success", "message": "Buyurtma qabul qilindi"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
