from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from haversine import haversine, Unit

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fieldops-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="FieldOps API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============== MODELS ==============

class CompanyCreate(BaseModel):
    company_name: str
    industry_type: str
    gst: Optional[str] = None
    head_office_location: str
    admin_email: EmailStr
    admin_mobile: str
    admin_name: str
    password: str

class CompanyConfig(BaseModel):
    product_categories: List[str] = []
    dealer_types: List[str] = ["Retailer", "Distributor", "Wholesaler"]
    working_hours: dict = {"start": "09:00", "end": "18:00"}
    visit_radius: int = 500
    visits_per_day_target: int = 10
    sales_target: Optional[float] = None

class TerritoryCreate(BaseModel):
    name: str
    type: str  # State, City, Area, Beat
    parent_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class DealerCreate(BaseModel):
    name: str
    dealer_type: str
    category_mapping: List[str] = []
    lat: float
    lng: float
    address: str
    territory_id: str
    visit_frequency: str = "Weekly"
    priority_level: int = 1
    contact_person: Optional[str] = None
    phone: Optional[str] = None

class SalesExecutiveCreate(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    password: str
    employee_code: str
    territory_ids: List[str] = []
    product_category_access: List[str] = []

class VisitCreate(BaseModel):
    dealer_id: str
    lat: float
    lng: float

class VisitOutcome(BaseModel):
    outcome: str  # Order Booked, Follow-up Required, No Meeting, Lost Visit
    order_value: Optional[float] = None
    notes: Optional[str] = None
    next_visit_date: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class LocationUpdate(BaseModel):
    lat: float
    lng: float

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str, company_id: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "company_id": company_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== COMPANY ROUTES ==============

@api_router.post("/company/register")
async def register_company(data: CompanyCreate):
    # Check if company or email exists
    existing = await db.companies.find_one({"$or": [
        {"company_name": data.company_name},
        {"admin_email": data.admin_email}
    ]})
    if existing:
        raise HTTPException(status_code=400, detail="Company or email already exists")
    
    company_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create company
    company_doc = {
        "id": company_id,
        "company_name": data.company_name,
        "industry_type": data.industry_type,
        "gst": data.gst,
        "head_office_location": data.head_office_location,
        "admin_email": data.admin_email,
        "admin_mobile": data.admin_mobile,
        "config": CompanyConfig().model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(company_doc)
    
    # Create super admin user
    user_doc = {
        "id": user_id,
        "company_id": company_id,
        "name": data.admin_name,
        "email": data.admin_email,
        "mobile": data.admin_mobile,
        "password": hash_password(data.password),
        "role": "super_admin",
        "territory_ids": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, "super_admin", company_id)
    return {"token": token, "user_id": user_id, "company_id": company_id, "role": "super_admin"}

@api_router.put("/company/config")
async def update_company_config(config: CompanyConfig, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.companies.update_one(
        {"id": user["company_id"]},
        {"$set": {"config": config.model_dump()}}
    )
    return {"message": "Configuration updated"}

@api_router.get("/company/config")
async def get_company_config(user=Depends(get_current_user)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"], user["company_id"])
    return {
        "token": token,
        "user_id": user["id"],
        "company_id": user["company_id"],
        "role": user["role"],
        "name": user["name"]
    }

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    user_data = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

# ============== TERRITORY ROUTES ==============

@api_router.post("/territories")
async def create_territory(data: TerritoryCreate, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    territory_id = str(uuid.uuid4())
    territory_doc = {
        "id": territory_id,
        "company_id": user["company_id"],
        "name": data.name,
        "type": data.type,
        "parent_id": data.parent_id,
        "lat": data.lat,
        "lng": data.lng,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.territories.insert_one(territory_doc)
    return {"id": territory_id, **data.model_dump()}

@api_router.get("/territories")
async def get_territories(user=Depends(get_current_user)):
    territories = await db.territories.find(
        {"company_id": user["company_id"]},
        {"_id": 0}
    ).to_list(1000)
    return territories

@api_router.delete("/territories/{territory_id}")
async def delete_territory(territory_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.territories.delete_one({"id": territory_id, "company_id": user["company_id"]})
    return {"message": "Territory deleted"}

@api_router.put("/territories/{territory_id}")
async def update_territory(territory_id: str, data: TerritoryCreate, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.territories.update_one(
        {"id": territory_id, "company_id": user["company_id"]},
        {"$set": {
            "name": data.name,
            "type": data.type,
            "parent_id": data.parent_id,
            "lat": data.lat,
            "lng": data.lng
        }}
    )
    return {"message": "Territory updated"}

# ============== DEALER ROUTES ==============

@api_router.post("/dealers")
async def create_dealer(data: DealerCreate, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    dealer_id = str(uuid.uuid4())
    dealer_doc = {
        "id": dealer_id,
        "company_id": user["company_id"],
        **data.model_dump(),
        "last_visit_date": None,
        "next_visit_due": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dealers.insert_one(dealer_doc)
    return {"id": dealer_id, **data.model_dump()}

@api_router.get("/dealers")
async def get_dealers(territory_id: Optional[str] = None, user=Depends(get_current_user)):
    query = {"company_id": user["company_id"]}
    if territory_id:
        query["territory_id"] = territory_id
    
    dealers = await db.dealers.find(query, {"_id": 0}).to_list(1000)
    return dealers

@api_router.put("/dealers/{dealer_id}")
async def update_dealer(dealer_id: str, data: DealerCreate, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.dealers.update_one(
        {"id": dealer_id, "company_id": user["company_id"]},
        {"$set": data.model_dump()}
    )
    return {"message": "Dealer updated"}

@api_router.delete("/dealers/{dealer_id}")
async def delete_dealer(dealer_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.dealers.delete_one({"id": dealer_id, "company_id": user["company_id"]})
    return {"message": "Dealer deleted"}

# ============== SALES EXECUTIVE ROUTES ==============

@api_router.post("/sales-executives")
async def create_sales_executive(data: SalesExecutiveCreate, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "company_id": user["company_id"],
        "name": data.name,
        "email": data.email,
        "mobile": data.mobile,
        "password": hash_password(data.password),
        "role": "sales_executive",
        "employee_code": data.employee_code,
        "territory_ids": data.territory_ids,
        "product_category_access": data.product_category_access,
        "device_id": None,
        "current_location": None,
        "last_location_update": None,
        "is_in_market": False,
        "market_start_time": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return {"id": user_id, "name": data.name, "email": data.email}

@api_router.get("/sales-executives")
async def get_sales_executives(user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    executives = await db.users.find(
        {"company_id": user["company_id"], "role": "sales_executive"},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return executives

@api_router.put("/sales-executives/{exec_id}/assign-territory")
async def assign_territory(exec_id: str, territory_ids: List[str], user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.users.update_one(
        {"id": exec_id, "company_id": user["company_id"]},
        {"$set": {"territory_ids": territory_ids}}
    )
    return {"message": "Territory assigned"}

@api_router.delete("/sales-executives/{exec_id}")
async def delete_sales_executive(exec_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.users.delete_one({"id": exec_id, "company_id": user["company_id"], "role": "sales_executive"})
    return {"message": "Sales executive deleted"}

# ============== FIELD VISIT ROUTES ==============

@api_router.post("/visit/start-market")
async def start_market(location: LocationUpdate, user=Depends(get_current_user)):
    if user["role"] != "sales_executive":
        raise HTTPException(status_code=403, detail="Only sales executives can start market")
    
    start_time = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user["user_id"]},
        {"$set": {
            "is_in_market": True,
            "market_start_time": start_time,
            "current_location": {"lat": location.lat, "lng": location.lng},
            "last_location_update": start_time
        }}
    )
    
    # Create market session
    session_id = str(uuid.uuid4())
    session_doc = {
        "id": session_id,
        "user_id": user["user_id"],
        "company_id": user["company_id"],
        "start_time": start_time,
        "start_location": {"lat": location.lat, "lng": location.lng},
        "end_time": None,
        "total_distance": 0,
        "visits_completed": 0,
        "lost_visits": 0
    }
    await db.market_sessions.insert_one(session_doc)
    
    return {"session_id": session_id, "start_time": start_time}

@api_router.post("/visit/end-market")
async def end_market(user=Depends(get_current_user)):
    if user["role"] != "sales_executive":
        raise HTTPException(status_code=403, detail="Only sales executives can end market")
    
    end_time = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user["user_id"]},
        {"$set": {"is_in_market": False, "market_start_time": None}}
    )
    
    # Update latest session
    session = await db.market_sessions.find_one(
        {"user_id": user["user_id"], "end_time": None},
        sort=[("start_time", -1)]
    )
    if session:
        await db.market_sessions.update_one(
            {"id": session["id"]},
            {"$set": {"end_time": end_time}}
        )
    
    return {"message": "Market ended", "end_time": end_time}

@api_router.get("/visit/nearby-dealers")
async def get_nearby_dealers(lat: float, lng: float, user=Depends(get_current_user)):
    # Get company config for radius
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    radius = company.get("config", {}).get("visit_radius", 500) if company else 500
    
    # Get user's assigned territories
    user_data = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    territory_ids = user_data.get("territory_ids", []) if user_data else []
    
    # Get all dealers in assigned territories
    query = {"company_id": user["company_id"]}
    if territory_ids:
        query["territory_id"] = {"$in": territory_ids}
    
    dealers = await db.dealers.find(query, {"_id": 0}).to_list(1000)
    
    # Filter by distance and calculate
    current_pos = (lat, lng)
    nearby = []
    for dealer in dealers:
        dealer_pos = (dealer["lat"], dealer["lng"])
        distance = haversine(current_pos, dealer_pos, unit=Unit.METERS)
        if distance <= radius:
            dealer["distance"] = round(distance, 2)
            nearby.append(dealer)
    
    # Sort by priority and distance
    nearby.sort(key=lambda x: (x.get("priority_level", 999), x.get("distance", 999)))
    return nearby

@api_router.post("/visit/check-in")
async def check_in(data: VisitCreate, user=Depends(get_current_user)):
    if user["role"] != "sales_executive":
        raise HTTPException(status_code=403, detail="Only sales executives can check in")
    
    # Verify dealer exists
    dealer = await db.dealers.find_one({"id": data.dealer_id}, {"_id": 0})
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    
    # Verify within geo-fence
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    radius = company.get("config", {}).get("visit_radius", 500) if company else 500
    
    current_pos = (data.lat, data.lng)
    dealer_pos = (dealer["lat"], dealer["lng"])
    distance = haversine(current_pos, dealer_pos, unit=Unit.METERS)
    
    if distance > radius:
        raise HTTPException(status_code=400, detail=f"Too far from dealer location. Distance: {round(distance)}m, allowed: {radius}m")
    
    visit_id = str(uuid.uuid4())
    visit_doc = {
        "id": visit_id,
        "company_id": user["company_id"],
        "user_id": user["user_id"],
        "dealer_id": data.dealer_id,
        "dealer_name": dealer["name"],
        "check_in_time": datetime.now(timezone.utc).isoformat(),
        "check_in_location": {"lat": data.lat, "lng": data.lng},
        "check_out_time": None,
        "check_out_location": None,
        "outcome": None,
        "order_value": None,
        "notes": None,
        "next_visit_date": None,
        "time_spent_minutes": None,
        "distance_from_dealer": round(distance, 2)
    }
    await db.visits.insert_one(visit_doc)
    
    return {"visit_id": visit_id, "check_in_time": visit_doc["check_in_time"], "distance": round(distance, 2)}

@api_router.post("/visit/{visit_id}/check-out")
async def check_out(visit_id: str, outcome: VisitOutcome, lat: float, lng: float, user=Depends(get_current_user)):
    visit = await db.visits.find_one({"id": visit_id, "user_id": user["user_id"]}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    check_out_time = datetime.now(timezone.utc)
    check_in_time = datetime.fromisoformat(visit["check_in_time"].replace('Z', '+00:00'))
    time_spent = (check_out_time - check_in_time).total_seconds() / 60
    
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {
            "check_out_time": check_out_time.isoformat(),
            "check_out_location": {"lat": lat, "lng": lng},
            "outcome": outcome.outcome,
            "order_value": outcome.order_value,
            "notes": outcome.notes,
            "next_visit_date": outcome.next_visit_date,
            "time_spent_minutes": round(time_spent, 2)
        }}
    )
    
    # Update dealer last visit
    await db.dealers.update_one(
        {"id": visit["dealer_id"]},
        {"$set": {
            "last_visit_date": check_out_time.isoformat(),
            "next_visit_due": outcome.next_visit_date
        }}
    )
    
    # Update session stats
    await db.market_sessions.update_one(
        {"user_id": user["user_id"], "end_time": None},
        {"$inc": {"visits_completed": 1}}
    )
    
    return {"message": "Check-out complete", "time_spent_minutes": round(time_spent, 2)}

@api_router.post("/visit/update-location")
async def update_location(location: LocationUpdate, user=Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["user_id"]},
        {"$set": {
            "current_location": {"lat": location.lat, "lng": location.lng},
            "last_location_update": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Location updated"}

@api_router.get("/visits/today")
async def get_today_visits(user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    
    query = {"company_id": user["company_id"]}
    if user["role"] == "sales_executive":
        query["user_id"] = user["user_id"]
    
    visits = await db.visits.find(
        {**query, "check_in_time": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    return visits

@api_router.get("/visits/history")
async def get_visit_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    exec_id: Optional[str] = None,
    user=Depends(get_current_user)
):
    query = {"company_id": user["company_id"]}
    
    if user["role"] == "sales_executive":
        query["user_id"] = user["user_id"]
    elif exec_id:
        query["user_id"] = exec_id
    
    if start_date:
        query["check_in_time"] = {"$gte": start_date}
    if end_date:
        if "check_in_time" in query:
            query["check_in_time"]["$lte"] = end_date
        else:
            query["check_in_time"] = {"$lte": end_date}
    
    visits = await db.visits.find(query, {"_id": 0}).sort("check_in_time", -1).to_list(1000)
    return visits

# ============== LIVE TRACKING ROUTES ==============

@api_router.get("/tracking/live")
async def get_live_tracking(user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    executives = await db.users.find(
        {"company_id": user["company_id"], "role": "sales_executive"},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return executives

# ============== REPORTS ROUTES ==============

@api_router.get("/reports/dashboard")
async def get_dashboard_stats(user=Depends(get_current_user)):
    company_id = user["company_id"]
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Total stats
    total_dealers = await db.dealers.count_documents({"company_id": company_id})
    total_executives = await db.users.count_documents({"company_id": company_id, "role": "sales_executive"})
    active_executives = await db.users.count_documents({"company_id": company_id, "role": "sales_executive", "is_in_market": True})
    
    # Today's visits
    today_visits = await db.visits.find(
        {"company_id": company_id, "check_in_time": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    
    visits_completed = len([v for v in today_visits if v.get("check_out_time")])
    total_order_value = sum(v.get("order_value", 0) or 0 for v in today_visits)
    
    # Get company target
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    target_visits = (company.get("config", {}).get("visits_per_day_target", 10) or 10) * total_executives
    
    return {
        "total_dealers": total_dealers,
        "total_executives": total_executives,
        "active_executives": active_executives,
        "visits_today": visits_completed,
        "target_visits": target_visits,
        "total_order_value": total_order_value,
        "visit_completion_rate": round((visits_completed / target_visits * 100) if target_visits > 0 else 0, 1)
    }

@api_router.get("/reports/executive-performance")
async def get_executive_performance(exec_id: Optional[str] = None, user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {"company_id": user["company_id"], "role": "sales_executive"}
    if exec_id:
        query["id"] = exec_id
    
    executives = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    performance = []
    for exec in executives:
        visits = await db.visits.find({"user_id": exec["id"]}, {"_id": 0}).to_list(1000)
        total_visits = len(visits)
        completed_visits = len([v for v in visits if v.get("check_out_time")])
        total_orders = sum(v.get("order_value", 0) or 0 for v in visits)
        avg_time = sum(v.get("time_spent_minutes", 0) or 0 for v in visits) / max(completed_visits, 1)
        
        performance.append({
            "id": exec["id"],
            "name": exec["name"],
            "employee_code": exec.get("employee_code"),
            "total_visits": total_visits,
            "completed_visits": completed_visits,
            "total_orders": total_orders,
            "avg_time_per_visit": round(avg_time, 1),
            "is_in_market": exec.get("is_in_market", False),
            "current_location": exec.get("current_location")
        })
    
    return performance

@api_router.get("/reports/lost-visits")
async def get_lost_visits(user=Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    visits = await db.visits.find(
        {"company_id": user["company_id"], "outcome": "Lost Visit"},
        {"_id": 0}
    ).to_list(1000)
    return visits

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "FieldOps API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
