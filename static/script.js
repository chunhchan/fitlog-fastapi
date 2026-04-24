const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const workoutForm = document.getElementById("workout-form");
const tableBody = document.getElementById("workout-table-body");
const message = document.getElementById("message");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const userInfo = document.getElementById("user-info");

let token = localStorage.getItem("token");
let userEmail = localStorage.getItem("userEmail");
let userName = localStorage.getItem("userName");


function showMessage(text) {
    message.textContent = text;
}


function updateView() {
    if (token) {
        authSection.style.display = "none";
        appSection.style.display = "block";
        userInfo.textContent = `Logged in as ${userName} (${userEmail})`;
        fetchWorkouts();
    } else {
        authSection.style.display = "grid";
        appSection.style.display = "none";
        tableBody.innerHTML = "";
    }
}


registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = {
        name: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value
    };

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.detail || "Registration failed");
            return;
        }

        showMessage("Registration successful. You can now log in.");
        registerForm.reset();

    } catch (error) {
        showMessage("Error registering user.");
        console.error(error);
    }
});


loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
    };

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.detail || "Login failed");
            return;
        }

        token = data.access_token;
        userName = data.name;
        userEmail = data.email;

        localStorage.setItem("token", token);
        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);

        showMessage("Login successful.");
        loginForm.reset();
        updateView();

    } catch (error) {
        showMessage("Error logging in.");
        console.error(error);
    }
});


async function fetchWorkouts() {
    try {
        const response = await fetch("/workouts", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const workouts = await response.json();

        tableBody.innerHTML = "";

        workouts.forEach(workout => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${workout.exercise}</td>
                <td>${workout.sets}</td>
                <td>${workout.reps}</td>
                <td>${workout.weight}</td>
                <td>${workout.date}</td>
                <td>
                    <button type="button" onclick="editWorkout('${workout.id}', '${workout.exercise}', ${workout.sets}, ${workout.reps}, ${workout.weight}, '${workout.date}')">Edit</button>
                    <button type="button" onclick="deleteWorkout('${workout.id}')">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        showMessage("Error loading workouts.");
        console.error(error);
    }
}


workoutForm.addEventListener("submit", async function (e) {
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
        if (id) {
            await fetch(`/workouts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(workout)
            });
        } else {
            await fetch("/workouts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(workout)
            });
        }

        workoutForm.reset();
        document.getElementById("workout-id").value = "";
        fetchWorkouts();

    } catch (error) {
        showMessage("Error saving workout.");
        console.error(error);
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
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        fetchWorkouts();

    } catch (error) {
        showMessage("Error deleting workout.");
        console.error(error);
    }
}


function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    token = null;
    userName = null;
    userEmail = null;

    workoutForm.reset();
    tableBody.innerHTML = "";
    showMessage("Logged out.");
    updateView();
}



updateView();
