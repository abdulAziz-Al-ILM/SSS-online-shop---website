import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

# database_web.py faylidan barcha funksiyalarni chaqirib olamiz
from database_web import (
    get_all_active_products, get_combined_info, 
    get_all_services, get_all_locations, get_active_ads,
    create_web_order
)

app = FastAPI(title="SSS Online Shop API")

# Loyiha uchun zarur papkalarni tekshirish va yaratish
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Statik fayllar (CSS, JS) va HTML shablonlarni ulash
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Telegram bot tokeni (Rasmlarni tortish uchun zarur)
BOT_TOKEN = os.getenv("BOT_TOKEN")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Asosiy sahifa: Firma ma'lumotlari va logotipni yuklaydi"""
    info = await get_combined_info()
    # O'zgarish: Argumentlar nomini (request=, name=, context=) aniq ko'rsatamiz
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={
            "request": request,
            "info": info, 
            "logo_id": info.get("logo_id")
        }
    )
# --- API MARSHRUTLAR ---

@app.get("/api/products")
async def api_get_products():
    """Mahsulotlar ro'yxatini qaytaradi"""
    products = await get_all_active_products()
    return {"status": "success", "data": products}

@app.get("/api/services")
async def api_get_services():
    """Xizmatlar ro'yxatini qaytaradi"""
    services = await get_all_services()
    return {"status": "success", "data": services}

@app.get("/api/locations")
async def api_get_locations():
    """Filiallar lokatsiyalarini qaytaradi"""
    locations = await get_all_locations()
    return {"status": "success", "data": locations}

@app.get("/api/ads")
async def api_get_ads():
    """Aktiv reklamalar va bonuslarni qaytaradi"""
    ads = await get_active_ads()
    return {"status": "success", "data": ads}

@app.get("/api/image/{file_id}")
async def get_telegram_image(file_id: str):
    """Telegram file_id orqali rasmlarni saytda ko'rsatish uchun proxy"""
    if not file_id or file_id == "None":
        return {"error": "ID noto'g'ri"}
    try:
        async with httpx.AsyncClient() as client:
            # Telegram API orqali fayl yo'lini topish
            res = await client.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getFile?file_id={file_id}")
            data = res.json()
            if not data.get("ok"): 
                return {"error": "Telegram serveri bilan aloqa o'rnatilmadi"}
            
            file_path = data["result"]["file_path"]
            # Faylni Telegram serveridan tortib olish va saytga uzatish
            img_res = await client.get(f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}")
            return StreamingResponse(img_res.iter_bytes(), media_type="image/jpeg")
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/order")
async def api_create_order(order_data: dict):
    """Saytdan yuborilgan buyurtmalarni qabul qilish va bazaga saqlash"""
    product_id = order_data.get("product_id")
    name = order_data.get("name")
    phone = order_data.get("phone")
    
    success = await create_web_order(product_id, name, phone)
    
    if success:
        return {"status": "success", "message": "Buyurtma bazaga muvaffaqiyatli yozildi"}
    else:
        return {"status": "error", "message": "Buyurtma saqlashda xatolik yuz berdi"}

if __name__ == "__main__":
    # Railway PORT ni o'zi taqdim etadi, aks holda 8000 ishlatiladi
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
