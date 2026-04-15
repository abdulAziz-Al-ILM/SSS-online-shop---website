import os
import time
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

MONGO_URL = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_URL)
db = client['sss_new_shop'] 
products_col = db['products']
settings_col = db['settings']
orders_col = db['orders']
services_col = db['services']
locations_col = db['locations']
ads_col = db['ads']

async def get_all_active_products():
    try:
        cursor = products_col.find({"stock": {"$gt": 0}})
        products = await cursor.to_list(length=100)
        for p in products: 
            p["_id"] = str(p["_id"])
        return products
    except Exception as e:
        print(f"Mahsulotlarni olishda xatolik: {e}")
        return []

async def get_combined_info():
    try:
        info = await settings_col.find_one({"type": "info"}) or {}
        socials = await settings_col.find_one({"type": "socials"}) or {}
        logo = await settings_col.find_one({"type": "logo"}) or {}
        
        return {
            "address": info.get("address", "Манзил киритилмаган"),
            "phone": info.get("phone", "+998"),
            "about": info.get("about", "Доим хизматингиздамиз!"),
            "telegram_bot": socials.get("telegram", "#"),
            "telegram_channel": socials.get("channel", "#"),
            "instagram": socials.get("instagram", "#"),
            "whatsapp": socials.get("whatsapp", "#"),
            "logo_id": logo.get("file_id")
        }
    except Exception as e:
        # Xato bo'lganda sayt qulab tushmasligi uchun vaqtinchalik ma'lumot qaytaramiz
        print(f"Baza bilan bog'lanishda xatolik (Info): {e}")
        return {
            "address": "Texnik xizmat ko'rsatilmoqda",
            "phone": "Tez orada qaytamiz",
            "about": "Saytda texnik ishlar olib borilmoqda. Tushunganingiz uchun rahmat.",
            "telegram_bot": "#", "telegram_channel": "#",
            "instagram": "#", "whatsapp": "#", "logo_id": None
        }

async def get_all_services():
    try:
        cursor = services_col.find({})
        services = await cursor.to_list(length=20)
        for s in services: s["_id"] = str(s["_id"])
        return services
    except Exception: return []

async def get_all_locations():
    try:
        cursor = locations_col.find({})
        locations = await cursor.to_list(length=10)
        for l in locations: l["_id"] = str(l["_id"])
        return locations
    except Exception: return []

async def get_active_ads():
    try:
        cursor = ads_col.find({"active": True})
        ads = await cursor.to_list(length=5)
        for a in ads: a["_id"] = str(a["_id"])
        return ads
    except Exception: return []

async def create_web_order(product_id, name, phone):
    try:
        # Xavfsizlik: Buzuq formatdagi ID kelsa server qulashini oldini olish
        if not ObjectId.is_valid(product_id):
            return False
            
        product = await products_col.find_one({"_id": ObjectId(product_id)})
        if not product: 
            return False
        
        order_id = "WEB-" + str(int(time.time() * 1000))[-4:]
        
        order_data = {
            "order_id": order_id,
            "user_id": "Veb-sayt", 
            "user_name": name,
            "phone": phone,
            "cart": {str(product_id): {"name": product["name"], "price": product["price"], "qty": 1}},
            "total_price": product["price"],
            "pay_method": "Saytdan buyurtma",
            "delivery_type": "Kiritilmagan",
            "location": "Kiritilmagan",
            "comment": "Sayt orqali yuborildi",
            "status": "new",
            "created_at": time.time()
        }
        await orders_col.insert_one(order_data)
        return True
    except Exception as e:
        print(f"Buyurtma saqlashda xatolik: {e}")
        return False
