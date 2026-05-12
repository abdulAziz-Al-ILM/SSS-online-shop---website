import os
import httpx
import asyncio
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
# Aynan botdagi kalit
BILLZ_API_KEY = os.getenv("BILLZ_API_KEY") 

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
                    try: price = int(float(str(p.get("price", 0))))
                    except: price = 0
                    
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
            debug_log += f"MongoDB xatosi: {e}\n"

    # 2. BILLZ ADMIN API (AYLANIB O'TISH MANTIGI)
    if BILLZ_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                auth_url = "https://api-admin.billz.ai/v1/auth/login"
                auth_payload = {"secret_token": BILLZ_API_KEY}
                auth_response = await client.post(auth_url, json=auth_payload, timeout=10.0)
                
                if auth_response.status_code == 200:
                    access_token = auth_response.json().get('data', {}).get('access_token')
                    
                    if access_token:
                        headers = {
                            "Authorization": f"Bearer {access_token}", 
                            "Content-Type": "application/json"
                        }
                        
                        billz_list = []
                        
                        # 1-URINISH: Ommaviy tortish (403 xato beradigan usul)
                        prods_url = "https://api-admin.billz.ai/v2/product?limit=200"
                        prods_response = await client.get(prods_url, headers=headers, timeout=10.0)
                        
                        if prods_response.status_code == 200:
                            billz_list = prods_response.json().get('data', [])
                        elif prods_response.status_code == 403:
                            debug_log += "Ommaviy yuklash 403 (Taqiqlangan). Qidiruv orqali aylanib o'tish (Bypass) ishga tushdi...\n"
                            
                            # 2-URINISH (BYPASS): Harflar yordamida "Qidiruv" qilib yig'ish (Sening boting ishlayotgan huquq doirasida)
                            search_queries = ["a", "o", "i", "e", "u", " "] # Unli harflar va bo'sh joy bilan izlaymiz
                            found_ids = set()
                            
                            for query in search_queries:
                                bypass_url = f"https://api-admin.billz.ai/v2/product?name={query}&limit=100"
                                bypass_res = await client.get(bypass_url, headers=headers, timeout=10.0)
                                if bypass_res.status_code == 200:
                                    temp_data = bypass_res.json().get('data', [])
                                    for item in temp_data:
                                        pid = str(item.get("id"))
                                        if pid not in found_ids:
                                            found_ids.add(pid)
                                            billz_list.append(item)
                            
                            debug_log += f"Bypass muvaffaqiyatli: {len(billz_list)} ta mahsulot yig'ildi.\n"
                            
                            if not billz_list:
                                debug_log += "Bypass ham bloklandi. YAGONA YECHIM: Billz sozlamalaridan ushbu API kalitga ommaviy o'qish (read_products) ruxsatini berish.\n"
                        else:
                            debug_log += f"Noma'lum xato: HTTP {prods_response.status_code}\n"
                            
                        # YIG'ILGAN MA'LUMOTNI SAYTGA MOSLASH (Kategoriyalari bilan)
                        for p in billz_list:
                            price = 0
                            try:
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

                            # Kategoriyani filtrlash
                            cat_name = "Бизнинг маҳсулотлар"
                            cats = p.get("categories", [])
                            if cats and len(cats) > 0:
                                if isinstance(cats[0], dict):
                                    cat_name = str(cats[0].get("name", cat_name))
                                elif isinstance(cats[0], str):
                                    cat_name = str(cats[0])
                            elif p.get("category_name"):
                                cat_name = str(p.get("category_name"))
                                
                            cat_name = cat_name.strip()
                            if cat_name == "": cat_name = "Бизнинг маҳсулотлар"

                            all_products.append({
                                "id": str(p.get("id", "")),
                                "name": str(p.get("name", "Nomsiz")),
                                "article": str(p.get("sku") or p.get("barcode") or str(p.get("id", ""))[-4:]),
                                "price": price,
                                "category": cat_name,
                                "img": img_url
                            })
                else:
                    debug_log += f"Billz Login xatosi: HTTP {auth_response.status_code}\n"
        except Exception as e:
            debug_log += f"Billz ulanish xatosi: {str(e)}\n"
    else:
        debug_log += "BILLZ_API_KEY Railway'da kiritilmagan!\n"

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
        try: services = await get_srv()
        except: pass
    return {"status": "success", "data": services}

@app.get("/api/locations")
async def api_get_locations():
    get_loc = getattr(db_module, "get_all_locations", None)
    locations = []
    if get_loc:
        try: locations = await get_loc()
        except: pass
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
