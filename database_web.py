import os
import time
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Ma'lumotlar bazasi bilan bog'lanish (Railway environment variables orqali)
MONGO_URL = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_URL)
db = client['sss_new_shop'] 
products_col = db['products']
settings_col = db['settings']
orders_col = db['orders']

# Saytdagi dinamik bo'limlar uchun kolleksiyalar
services_col = db['services']
locations_col = db['locations']
ads_col = db['ads']

async def get_all_active_products():
    """Ombordagi barcha aktiv mahsulotlar ro'yxatini olish"""
    cursor = products_col.find({"stock": {"$gt": 0}})
    products = await cursor.to_list(length=100)
    for p in products: 
        p["_id"] = str(p["_id"])
    return products

async def get_combined_info():
    """Firma ma'lumotlari, ijtimoiy tarmoqlar va logotipni bitta lug'atga yig'ish"""
    info = await settings_col.find_one({"type": "info"}) or {}
    socials = await settings_col.find_one({"type": "socials"}) or {}
    logo = await settings_col.find_one({"type": "logo"}) or {}
    
    combined = {
        "address": info.get("address", "Манзил киритилмаган"),
        "phone": info.get("phone", "+998"),
        "about": info.get("about", "Доим хизматингиздамиз!"),
        "telegram_bot": socials.get("telegram", "#"),
        "telegram_channel": socials.get("channel", "#"),
        "instagram": socials.get("instagram", "#"),
        "whatsapp": socials.get("whatsapp", "#"),
        "logo_id": logo.get("file_id")
    }
    return combined

async def get_all_services():
    """Barcha xizmatlar ro'yxatini olish"""
    cursor = services_col.find({})
    services = await cursor.to_list(length=20)
    for s in services: 
        s["_id"] = str(s["_id"])
    return services

async def get_all_locations():
    """Filiallar lokatsiyalarini olish"""
    cursor = locations_col.find({})
    locations = await cursor.to_list(length=10)
    for l in locations: 
        l["_id"] = str(l["_id"])
    return locations

async def get_active_ads():
    """Aktiv aksiyalar va bonuslarni olish"""
    cursor = ads_col.find({"active": True})
    ads = await cursor.to_list(length=5)
    for a in ads: 
        a["_id"] = str(a["_id"])
    return ads

async def create_web_order(product_id, name, phone):
    """Saytdan kelgan buyurtmani umumiy bazaga yozish"""
    try:
        # Mahsulot ma'lumotlarini bazadan tekshirish
        product = await products_col.find_one({"_id": ObjectId(product_id)})
        if not product: 
            return False
        
        # Sayt buyurtmalari uchun maxsus ID formatini yaratish
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
