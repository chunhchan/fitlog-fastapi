from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta


# Load environment variables from .env file
load_dotenv()

# Create FastAPI app
app = FastAPI()

# Connect static and template folders
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
print("Mongo URI:", MONGO_URI)
client = MongoClient(MONGO_URI)
db = client["fitlog_db"]
users_collection = db["users"]
workouts_collection = db["workouts"]


# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# Pydantic models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Workout(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: str


# Helper function to convert MongoDB ObjectId to string
def workout_serializer(workout):
    return {
        "id": str(workout["_id"]),
        "exercise": workout["exercise"],
        "sets": workout["sets"],
        "reps": workout["reps"],
        "weight": workout["weight"],
        "date": workout["date"],
        "user_email": workout["user_email"],
    }


# Password helper functions
def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# JWT token helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = users_collection.find_one({"email": email})

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Route for homepage
@app.get("/", response_class=HTMLResponse)
def read_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Register a new user
@app.post("/register")
def register_user(user: UserRegister):
    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
    }

    users_collection.insert_one(new_user)

    return {"message": "User registered successfully"}


# Login user
@app.post("/login")
def login_user(user: UserLogin):
    existing_user = users_collection.find_one({"email": user.email})

    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": existing_user["email"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": existing_user["name"],
        "email": existing_user["email"],
    }


# Get workouts for current logged-in user
@app.get("/workouts")
def get_workouts(current_user: dict = Depends(get_current_user)):
    workouts = workouts_collection.find({"user_email": current_user["email"]})
    return [workout_serializer(workout) for workout in workouts]


# Create workout for current logged-in user
@app.post("/workouts")
def create_workout(workout: Workout, current_user: dict = Depends(get_current_user)):
    new_workout = {
        "exercise": workout.exercise,
        "sets": workout.sets,
        "reps": workout.reps,
        "weight": workout.weight,
        "date": workout.date,
        "user_email": current_user["email"],
    }

    result = workouts_collection.insert_one(new_workout)
    new_workout["_id"] = result.inserted_id

    return workout_serializer(new_workout)


# Update workout
@app.put("/workouts/{workout_id}")
def update_workout(
    workout_id: str,
    updated_workout: Workout,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    result = workouts_collection.update_one(
        {"_id": ObjectId(workout_id), "user_email": current_user["email"]},
        {
            "$set": {
                "exercise": updated_workout.exercise,
                "sets": updated_workout.sets,
                "reps": updated_workout.reps,
                "weight": updated_workout.weight,
                "date": updated_workout.date,
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workout not found")

    workout = workouts_collection.find_one({"_id": ObjectId(workout_id)})
    return workout_serializer(workout)


# Delete workout
@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    result = workouts_collection.delete_one(
        {"_id": ObjectId(workout_id), "user_email": current_user["email"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workout not found")

    return {"message": "Workout deleted successfully"}
