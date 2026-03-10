// Get references to the workout form and the table body where workouts will be displayed
const form = document.getElementById("workout-form");
const tableBody = document.getElementById("workout-table-body");

// Log a message to confirm that the JavaScript file has loaded successfully
console.log("script loaded");

// Function to retrieve all workouts from the FastAPI backend and display them in the table
async function fetchWorkouts() {
    try {
        // Send a GET request to the backend API to retrieve the list of workouts
        const response = await fetch("/workouts");
        // Convert the response data into JSON format
        const workouts = await response.json();

        // Clear the existing table rows before adding updated data
        tableBody.innerHTML = "";

        // Loop through each workout and create a new table row for it
        workouts.forEach(workout => {
            // Create a new table row element
            const row = document.createElement("tr");
            // Insert workout data into the table row using template literals
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
            // Add the new row to the workout table body
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching workouts:", error);
    }
}
// Event listener for submitting the workout form
form.addEventListener("submit", async function (e) {
    // Prevent the page from reloading when the form is submitted
    e.preventDefault();
    console.log("form submitted");

    // Check if a workout ID exists (this determines whether we are editing or creating)
    const id = document.getElementById("workout-id").value;

    // Collect the form input values and create a workout object
    const workout = {
        exercise: document.getElementById("exercise").value,
        sets: parseInt(document.getElementById("sets").value),
        reps: parseInt(document.getElementById("reps").value),
        weight: parseFloat(document.getElementById("weight").value),
        date: document.getElementById("date").value
    };

    try {
        if (id) {
            const response = await fetch(`/workouts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workout)
            });
            console.log("update response:", response.status);
        } else {
            const response = await fetch("/workouts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workout)
            });
            console.log("post response:", response.status);
        }

        form.reset();
        document.getElementById("workout-id").value = "";
        fetchWorkouts();
    } catch (error) {
        console.error("Error saving workout:", error);
    }
});

function editWorkout(id, exercise, sets, reps, weight, date) {
    document.getElementById("workout-id").value = id;
    document.getElementById("exercise").value = exercise;
    document.getElementById("sets").value = sets;
    document.getElementById("reps").value = reps;
    document.getElementById("weight").value = weight;
    document.getElementById("date").value = date;
}

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

fetchWorkouts();