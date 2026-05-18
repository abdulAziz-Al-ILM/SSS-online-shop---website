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
BILLZ_API_KEY = os.getenv("BILLZ_API_KEY") 

CATEGORIES_DB = {
    "elektr jihozlari": "59ce55e6-0b1e-4be2-a646-87f3c8e95876", 
    "santexnika": "79233dfd-cec2-47ca-a787-403829e554d4", 
    "bo'yoqlar va emulsiya": "3a34e878-0f32-410c-bd0c-fc62c2ab8f60", 
    "kafel va plitkalar": "0325476b-8cab-4da1-94ec-ade1727f53ac", 
    "asbob-uskunalar": "7552b39d-aff3-4b21-a756-7014c17e8cbc",
    "issiqlik izolyatsiyasi": "03147648-a1bc-433f-a444-9cfaa2806c39", 
    "xo'jalik mollari": "45e95524-5047-43a6-8cf3-79e9f08becb8", 
    "pena, silikon va yelimlar": "6ed8fe11-e13e-4eb4-bfb4-8f69343695d1",
    "pardozlash materiallari": "335d4496-d096-478f-a813-73c21f1fc129", 
    "mayda qotirish vositalari": "4327ed6a-a49d-4966-98ff-34dd439f8254",
    "plintus va profillar": "a4bc6969-da19-4455-96dd-5de4aea6f441", 
    "muhandislik tizimlari": "f53dfb0f-6113-4a9e-b913-09c44cbbef10"
}

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
                        "article": str(p.get("article", f"BOT-{prod_id[-4:]}")),
                        "price": price,
                        "category": str(p.get("category", "Бизнинг маҳсулотлар")),
                        "img": f"/api/image/{p.get('file_id')}" if p.get('file_id') else "https://via.placeholder.com/300x200?text=Rasm+yo'q"
                    })
        except Exception as e:
            pass

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
                        found_ids = set()
                        
                        debug_log += "Kategoriyalar orqali ma'lumot qidirish (Bypass V2) ishga tushdi...\n"
                        
                        for cat_name_uz, cat_uuid in CATEGORIES_DB.items():
                            bypass_url = f"https://api-admin.billz.ai/v2/product?category_id={cat_uuid}&limit=50"
                            try:
                                bypass_res = await client.get(bypass_url, headers=headers, timeout=8.0)
                                if bypass_res.status_code == 200:
                                    temp_data = bypass_res.json().get('data', [])
                                    for item in temp_data:
                                        pid = str(item.get("id"))
                                        if pid not in found_ids:
                                            found_ids.add(pid)
                                            item['override_category'] = cat_name_uz.capitalize()
                                            billz_list.append(item)
                            except: continue
                        
                        debug_log += f"Bypass muvaffaqiyatli: {len(billz_list)} ta mahsulot yig'ildi.\n"
                        
                        if not billz_list:
                            debug_log += "ЯКУНИЙ ХУЛОСА: Тўлиқ блок. Маҳсулотларни рўйхат шаклида олиш бу калит билан таъқиқланган. Биллз операторларига қўнғироқ қилинг ва 'E-commerce (сайт) учун интеграция API калити кераклигини' айтинг.\n"
                            
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

                            all_products.append({
                                "id": str(p.get("id", "")),
                                "name": str(p.get("name", "Nomsiz")),
                                "article": str(p.get("sku") or p.get("barcode") or str(p.get("id", ""))[-4:]),
                                "price": price,
                                "category": p.get('override_category', 'Boshqa'),
                                "img": img_url
                            })
                else:
                    debug_log += f"Billz Login xatosi: HTTP {auth_response.status_code}\n"
        except Exception as e:
            debug_log += f"Billz xatosi: {str(e)}\n"

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
