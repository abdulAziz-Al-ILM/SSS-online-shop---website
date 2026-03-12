import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from database_web import get_all_active_products, get_company_info

app = FastAPI(title="ILM Construction Web API")

# Papkalarni yaratish mantiqi (agar yo'q bo'lsa)
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("static/img", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Statik fayllar (CSS, JS, Rasmlar) uchun ruxsat
app.mount("/static", StaticFiles(directory="static"), name="static")

# HTML shablonlar (Frontend qismi)
templates = Jinja2Templates(directory="templates")

# Frontend'ni yuklovchi asosiy sahifa
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    info = await get_company_info()
    return templates.TemplateResponse("index.html", {"request": request, "info": info})

# Saytdagi mahsulotlar uchun JSON API
@app.get("/api/products")
async def api_get_products():
    products = await get_all_active_products()
    return {"status": "success", "data": products}

# Saytdan buyurtma qabul qilish API'si (Hozircha karkas)
@app.post("/api/order")
async def api_create_order(order_data: dict):
    # Bu yerda buyurtmani qabul qilib, bazaga yozish va adminga bot orqali xabar berish mantiqi bo'ladi
    return {"status": "success", "message": "Buyurtma qabul qilindi"}

if __name__ == "__main__":
    # Railway o'zi PORT beradi, localda esa 8000 da ishlaydi
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
