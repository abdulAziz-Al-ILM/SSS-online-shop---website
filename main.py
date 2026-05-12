import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

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
# Railwaydan olinadigan o'zgaruvchilar
BILLZ_API_KEY = os.getenv("BILLZ_API_KEY") 
BILLZ_API_URL = os.getenv("BILLZ_API_URL", "https://api.billz.uz/v1/products")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    get_info = getattr(db_module, "get_combined_info", getattr(db_module, "get_shop_info", None))
    info = await get_info() if get_info else {}
    
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
        context={"request": request, "info": info, "logo_id": info.get("logo_id")}
    )

@app.get("/api/products")
async def api_get_products():
    all_products = []
    debug_log = ""
    
    # 1. BOT BAZASIDAN OLISH
    get_prods = getattr(db_module, "get_all_products", getattr(db_module, "get_all_active_products", None))
    if get_prods:
        try:
            db_prods = await get_prods()
            if db_prods:
                for p in db_prods:
                    try:
                        price = int(float(str(p.get("price", 0))))
                    except:
                        price = 0
                    
                    prod_id = str(p.get("_id", ""))
                    all_products.append({
                        "id": prod_id,
                        "name": str(p.get("name", "Nomsiz")),
                        "article": f"BOT-{prod_id[-4:]}",
                        "price": price,
                        "category": str(p.get("category", "Бизнинг маҳсулотлар")),
                        "img": f"/api/image/{p.get('file_id')}" if p.get('file_id') else "https://via.placeholder.com/300x200?text=Rasm+yo'q"
                    })
        except Exception as e:
            debug_log += f"MongoDB Xatosi: {e}\n"

    # 2. BILLZ TIZIMIDAN OLISH (To'g'ridan-to'g'ri integratsiya API)
    if BILLZ_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {BILLZ_API_KEY}", 
                    "Content-Type": "application/json"
                }
                
                response = await client.get(BILLZ_API_URL, headers=headers, timeout=15.0)
                debug_log += f"URL: {BILLZ_API_URL}\nSTATUS: {response.status_code}\nRAW RESPONSE: {response.text[:1000]}"
                
                if response.status_code == 200:
                    data = response.json()
                    billz_list = data if isinstance(data, list) else (data.get("products") or data.get("items") or data.get("data") or [])
                    
                    if not billz_list:
                        debug_log += "\nДИҚҚАТ: JSON ичида маҳсулотлар топилмади!"
                        
                    for p in billz_list:
                        price = 0
                        try:
                            # Narxni xavfsiz o'qish
                            p_val = p.get("retail_price") or p.get("price") or 0
                            price = int(float(str(p_val)))
                        except: pass
                        
                        img_url = "https://via.placeholder.com/300x200?text=Rasm+yo'q"
                        images = p.get("images", [])
                        if images and len(images) > 0:
                            if isinstance(images[0], str):
                                img_url = images[0]
                            elif isinstance(images[0], dict):
                                img_url = images[0].get("url", img_url)

                        cat_name = "Billz Catalog"
                        cats = p.get("categories", [])
                        if cats and len(cats) > 0 and isinstance(cats[0], dict):
                            cat_name = str(cats[0].get("name", cat_name))
                        elif p.get("category_name"):
                            cat_name = str(p.get("category_name"))

                        all_products.append({
                            "id": str(p.get("id", "")),
                            "name": str(p.get("name", "Nomsiz")),
                            "article": str(p.get("sku") or p.get("barcode") or str(p.get("id", ""))[-4:]),
                            "price": price,
                            "category": cat_name,
                            "img": img_url
                        })
                else:
                    debug_log += f"\nBILLZ API HTTP XATOSI: {response.status_code}"
        except Exception as e:
            debug_log += f"\nBILLZ ULANISH XATOSI: {str(e)}"
    else:
        debug_log += "\nBILLZ_API_KEY Railway'да йўқ!"

    return {
        "status": "success", 
        "data": all_products, 
        "total": len(all_products),
        "debug_info": debug_log
    }

@app.get("/api/services")
async def api_get_services():
    get_srv = getattr(db_module, "get_all_services", None)
    services = []
    if get_srv:
        try:
            services = await get_srv()
        except:
            pass
    return {"status": "success", "data": services}

@app.get("/api/locations")
async def api_get_locations():
    get_loc = getattr(db_module, "get_all_locations", None)
    locations = []
    if get_loc:
        try:
            locations = await get_loc()
        except:
            pass
    return {"status": "success", "data": locations}

@app.get("/api/image/{file_id}")
async def get_telegram_image(file_id: str):
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
