// Get the form and workout table
const form = document.getElementById("workout-form");
const tableBody = document.getElementById("workout-table-body");

// Load all workouts from the backend
async function fetchWorkouts() {
    try {
        const response = await fetch("/workouts");
        const workouts = await response.json();

        // Clear old rows
        tableBody.innerHTML = "";

        // Add each workout to the table
        workouts.forEach(workout => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${workout.exercise}</td>
                <td>${workout.sets}</td>
                <td>${workout.reps}</td>
                <td>${workout.weight}</td>
                <td>${workout.date}</td>
                <td>
                    <button type="button" onclick="editWorkout(${workout.id}, '${workout.exercise}', ${workout.sets}, ${workout.reps}, ${workout.weight}, '${workout.date}')">Edit</button>
                    <button type="button" onclick="deleteWorkout(${workout.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching workouts:", error);
    }
}

// Handle form submit for adding or updating a workout
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = document.getElementById("workout-id").value;

    const workout = {
        exercise: document.getElementById("exercise").value,
        sets: parseInt(document.getElementById("sets").value),
        reps: parseInt(document.getElementById("reps").value),
        weight: parseFloat(document.getElementById("weight").value),
        date: document.getElementById("date").value
    };

    try {
        // Update workout if ID exists
        if (id) {
            await fetch(`/workouts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workout)
            });
        }
        // Otherwise create a new workout
        else {
            await fetch("/workouts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workout)
            });
        }

        // Reset form and reload table
        form.reset();
        document.getElementById("workout-id").value = "";
        fetchWorkouts();
    } catch (error) {
        console.error("Error saving workout:", error);
    }
});

// Fill form with workout data when Edit is clicked
function editWorkout(id, exercise, sets, reps, weight, date) {
    document.getElementById("workout-id").value = id;
    document.getElementById("exercise").value = exercise;
    document.getElementById("sets").value = sets;
    document.getElementById("reps").value = reps;
    document.getElementById("weight").value = weight;
    document.getElementById("date").value = date;
}

// Delete a workout and refresh the table
async function deleteWorkout(id) {
    try {
        await fetch(`/workouts/${id}`, {
            method: "DELETE"
        });
        fetchWorkouts();
    } catch (error) {
        console.error("Error deleting workout:", error);
    }
}

// Load workouts when the page opens
fetchWorkouts();