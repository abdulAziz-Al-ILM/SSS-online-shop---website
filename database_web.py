import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_URL = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_URL)
db = client['sss_new_shop'] 
products_col = db['products']
settings_col = db['settings']
orders_col = db['orders']

# Yangi dinamik kolleksiyalar
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
    cursor = ads_col.find({"active": True}) # Faqat aktiv reklamalar
    ads = await cursor.to_list(length=5)
    for a in ads: a["_id"] = str(a["_id"])
    return ads
