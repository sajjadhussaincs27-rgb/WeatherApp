import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
const apiKey = "efcd635efdb0886af41bb957c3cc5679";

const result = document.getElementById("result");
const forecastContainer = document.getElementById("forecast");

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) getWeather(city);
});

/* AUTO LOCATION */
window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
        });
    }
};

async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    displayWeather(data);
    getForecast(city);
}

async function getWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    displayWeather(data);
    getForecast(data.name);
}

function displayWeather(data) {
    result.classList.remove("hidden");

    document.getElementById("city").textContent =
        `${data.name}, ${data.sys.country}`;

    const temp = data.main.temp;
    const tempElement = document.getElementById("temp");
    tempElement.textContent = Math.round(temp) + "°C";
tempElement.style.display = "block";
tempElement.style.color = "black";
tempElement.style.fontSize = "60px";



    document.getElementById("desc").textContent =
        data.weather[0].description;

    document.getElementById("humidity").textContent =
        `Humidity: ${data.main.humidity}%`;

    document.getElementById("wind").textContent =
        `Wind: ${data.wind.speed} m/s`;

    document.getElementById("icon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    /* Day / Night Mode */
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18)
        document.body.className = "day";
    else
        document.body.className = "night";
}

async function getForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    forecastContainer.innerHTML = "";

    const dailyData = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    );

    dailyData.forEach(day => {
        const card = document.createElement("div");
        card.classList.add("forecast-card");

        const date = new Date(day.dt_txt).toLocaleDateString("en-US", {
            weekday: "short"
        });

        card.innerHTML = `
            <p>${date}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
            <p>${Math.round(day.main.temp)}°C</p>
        `;

        forecastContainer.appendChild(card);
    });

    window.signup = function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(window.auth, email, password)
        .then(() => {
            alert("Signup successful");
        })
        .catch(err => alert(err.message));
};

window.login = function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(window.auth, email, password)
        .then(() => {
            alert("Login successful");
        })
        .catch(err => alert(err.message));
};
}