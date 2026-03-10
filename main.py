# Import necessary FastAPI modules and libraries for handling requests, responses,
# static files, templates, data validation, and type hints.
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List

# Create the FastAPI application instance
app = FastAPI()

# Mount the static folder so CSS and JavaScript files can be served to the browser
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# In-memory database
workouts = []
next_id = 1


# Pydantic model used to validate workout data sent from the frontend
class Workout(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: str


# Root route that renders the main HTML page for the FitLog application
@app.get("/", response_class=HTMLResponse)
def read_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# API endpoint to retrieve the list of all workout entries
@app.get("/workouts")
def get_workouts():
    return workouts


# API endpoint to create a new workout entry
# Receives workout data from the frontend and stores it in the in-memory list
@app.post("/workouts")
def create_workout(workout: Workout):
    global next_id
    new_workout = {
        "id": next_id,
        "exercise": workout.exercise,
        "sets": workout.sets,
        "reps": workout.reps,
        "weight": workout.weight,
        "date": workout.date,
    }
    workouts.append(new_workout)
    next_id += 1
    return new_workout


# API endpoint to update an existing workout entry by its ID
@app.put("/workouts/{workout_id}")
def update_workout(workout_id: int, updated_workout: Workout):
    for workout in workouts:
        if workout["id"] == workout_id:
            workout["exercise"] = updated_workout.exercise
            workout["sets"] = updated_workout.sets
            workout["reps"] = updated_workout.reps
            workout["weight"] = updated_workout.weight
            workout["date"] = updated_workout.date
            return workout
    return JSONResponse(content={"error": "Workout not found"}, status_code=404)


# API endpoint to delete a workout entry by its ID
@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int):
    for i, workout in enumerate(workouts):
        if workout["id"] == workout_id:
            deleted = workouts.pop(i)
            return deleted
    return JSONResponse(content={"error": "Workout not found"}, status_code=404)
