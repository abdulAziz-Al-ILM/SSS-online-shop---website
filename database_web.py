import os
import time
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

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
    cursor = products_col.find({"stock": {"$gt": 0}})
    products = await cursor.to_list(length=100)
    for p in products: p["_id"] = str(p["_id"])
    return products

async def get_company_info():
    info = await settings_col.find_one({"type": "info"})
    if info:
        info["_id"] = str(info["_id"])
        return info
    return {"address": "Asosiy manzil kiritilmagan", "phone": "+998", "about": "Doim xizmatingizdamiz"}

# ...
async def get_logo_id():
    logo = await settings_col.find_one({"type": "logo"})
    return logo['file_id'] if logo else None
# ...

async def get_all_services():
    cursor = services_col.find({})
    services = await cursor.to_list(length=20)
    for s in services: s["_id"] = str(s["_id"])
    return services

async def get_all_locations():
    cursor = locations_col.find({})
    locations = await cursor.to_list(length=10)
    for l in locations: l["_id"] = str(l["_id"])
    return locations

async def get_active_ads():
    cursor = ads_col.find({"active": True})
    ads = await cursor.to_list(length=5)
    for a in ads: a["_id"] = str(a["_id"])
    return ads

async def create_web_order(product_id, name, phone):
    try:
        product = await products_col.find_one({"_id": ObjectId(product_id)})
        if not product: return False
        
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
        print("Buyurtma yozishda xatolik:", e)
        return False
