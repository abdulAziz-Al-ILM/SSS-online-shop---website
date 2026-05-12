import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

# Baza faylini qanday nomlaganingni bilmaganimiz uchun ikkalasini ham sinab ko'ramiz
try:
    import database_web as db_module
except ImportError:
    import database as db_module

app = FastAPI(title="SSS Online Shop API - ILM Mizan")

os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

BOT_TOKEN = os.getenv("BOT_TOKEN")
BILLZ_API_KEY = os.getenv("BILLZ_API_KEY")
BILLZ_API_URL = os.getenv("BILLZ_API_URL", "https://api.billz.uz/v1/products")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Asosiy ma'lumotlarni xavfsiz chaqirish
    get_info = getattr(db_module, "get_combined_info", getattr(db_module, "get_shop_info", None))
    info = await get_info() if get_info else {}
    
    # Agar bazada ma'lumot bo'lmasa, sayt qulamasligi uchun default qiymatlar
    if not info:
        info = {
            "about": "Eng sifatli qurilish mollari ILM Mizan me'morligi ostida.",
            "phone": "+998 90 123 45 67",
            "telegram_bot": "https://t.me/sss_shop_bot",
            "telegram_channel": "https://t.me/sss_shop",
            "whatsapp": "https://wa.me/998901234567",
            "instagram": "https://instagram.com/sss_shop"
        }
        
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={
            "request": request,
            "info": info, 
            "logo_id": info.get("logo_id")
        }
    )

@app.get("/api/products")
async def api_get_products():
    """Bot bazasi va Billz API'dagi mahsulotlarni bittada yig'uvchi Beton Mantiq"""
    all_products = []
    
    # 1. BOT BAZASIDAN OLISH (MongoDB)
    get_prods = getattr(db_module, "get_all_products", getattr(db_module, "get_all_active_products", None))
    if get_prods:
        try:
            db_prods = await get_prods()
            if db_prods:
                for p in db_prods:
                    # Frontend uchun standartlashtiramiz
                    prod_id = str(p.get("_id", ""))
                    all_products.append({
                        "id": prod_id,
                        "name": p.get("name", "Nomsiz mahsulot"),
                        "article": f"BOT-{prod_id[-4:]}", # Bot mahsulotlariga maxsus artikul
                        "price": int(p.get("price", 0)),
                        "category": p.get("category", "Бизнинг маҳсулотлар"),
                        "img": f"/api/image/{p.get('file_id')}" if p.get('file_id') else "https://via.placeholder.com/300x200?text=Rasm+yo'q"
                    })
        except Exception as e:
            print(f"❌ MONGODB XATOSI: {e}")

    # 2. BILLZ API DAN OLISH
    if BILLZ_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {BILLZ_API_KEY}", "Content-Type": "application/json"}
                response = await client.get(BILLZ_API_URL, headers=headers, timeout=8.0)
                if response.status_code == 200:
                    data = response.json()
                    billz_list = data if isinstance(data, list) else (data.get("products") or data.get("items") or data.get("data") or [])
                    
                    for p in billz_list:
                        all_products.append({
                            "id": str(p.get("id", "")),
                            "name": p.get("name", "Nomsiz"),
                            "article": p.get("sku") or p.get("article") or str(p.get("id"))[-4:],
                            "price": int(p.get("price", 0)),
                            "category": p.get("category_name") or p.get("category") or "Billz Catalog",
                            "img": p.get("image_url") or "https://via.placeholder.com/300x200?text=Rasm+yo'q"
                        })
                else:
                    print(f"❌ BILLZ API XATOSI: Status {response.status_code}")
        except Exception as e:
            print(f"❌ BILLZ ULANISH XATOSI: {e}")

    return {"status": "success", "data": all_products, "total": len(all_products)}

@app.get("/api/services")
async def api_get_services():
    """Botdagi xizmatlarni xavfsiz chaqirish"""
    get_srv = getattr(db_module, "get_all_services", None)
    services = []
    if get_srv:
        try:
            services = await get_srv()
        except Exception as e:
            print(f"❌ XIZMATLAR XATOSI: {e}")
    return {"status": "success", "data": services}

@app.get("/api/image/{file_id}")
async def get_telegram_image(file_id: str):
    """Telegramdan rasmni saytga o'girib berish"""
    if not file_id or file_id == "None":
        return {"error": "Noto'g'ri ID"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getFile?file_id={file_id}")
            data = res.json()
            if not data.get("ok"): 
                return {"error": "Telegram serveri aloqa bermadi"}
            
            file_path = data["result"]["file_path"]
            img_res = await client.get(f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}")
            return StreamingResponse(img_res.iter_bytes(), media_type="image/jpeg")
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
