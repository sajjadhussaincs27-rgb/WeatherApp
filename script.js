import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const API_KEY = "efcd635efdb0886af41bb957c3cc5679";

/* ─── State ─────────────────────────────────── */
window.currentTab = "login";

/* ─── Auth tab switch ────────────────────────── */
window.switchTab = function (tab) {
  window.currentTab = tab;
  const isLogin = tab === "login";

  document.getElementById("tabLogin").classList.toggle("active", isLogin);
  document.getElementById("tabSignup").classList.toggle("active", !isLogin);
  document.getElementById("authBtnText").textContent = isLogin ? "Login" : "Create Account";
  document.getElementById("switchText").textContent = isLogin ? "Don't have an account?" : "Already have an account?";
  document.getElementById("switchLink").textContent = isLogin ? "Sign up" : "Login";
  document.getElementById("authError").classList.add("hidden");
};

/* ─── Handle auth ────────────────────────────── */
window.handleAuth = async function () {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const errEl = document.getElementById("authError");
  const loader = document.getElementById("authLoader");
  const btnText = document.getElementById("authBtnText");

  errEl.classList.add("hidden");
  loader.classList.remove("hidden");
  btnText.classList.add("hidden");

  try {
    if (window.currentTab === "signup") {
      await createUserWithEmailAndPassword(window._auth, email, password);
    } else {
      await signInWithEmailAndPassword(window._auth, email, password);
    }
  } catch (err) {
    const msg = err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim();
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  } finally {
    loader.classList.add("hidden");
    btnText.classList.remove("hidden");
  }
};

/* ─── Allow Enter key on auth inputs ─────────── */
["authEmail", "authPassword"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") window.handleAuth();
  });
});

/* ─── Logout ─────────────────────────────────── */
window.logout = async function () {
  await signOut(window._auth);
};

/* ─── Auth state observer ────────────────────── */
onAuthStateChanged(window._auth, user => {
  if (user) {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("weatherScreen").classList.remove("hidden");
    const emailShort = user.email.split("@")[0];
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userAvatar").textContent = emailShort[0].toUpperCase();
    autoLocate();
  } else {
    document.getElementById("authScreen").classList.remove("hidden");
    document.getElementById("weatherScreen").classList.add("hidden");
  }
});

/* ─── Search ─────────────────────────────────── */
window.searchCity = function () {
  const city = document.getElementById("cityInput").value.trim();
  if (city) fetchWeather(city);
};

document.getElementById("cityInput").addEventListener("keydown", e => {
  if (e.key === "Enter") window.searchCity();
});

/* ─── Auto-locate ────────────────────────────── */
function autoLocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather("New Delhi")
    );
  } else {
    fetchWeather("New Delhi");
  }
}

/* ─── API calls ──────────────────────────────── */
async function fetchWeather(city) {
  showLoading();
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`)
    ]);
    if (!weatherRes.ok) throw new Error("City not found. Please try another.");
    const weather = await weatherRes.json();
    const forecast = await forecastRes.json();
    renderWeather(weather, forecast);
  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoading();
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
    ]);
    const weather = await weatherRes.json();
    const forecast = await forecastRes.json();
    renderWeather(weather, forecast);
  } catch (err) {
    showError(err.message);
  }
}

/* ─── Render ─────────────────────────────────── */
function renderWeather(data, forecast) {
  hideStates();
  const card = document.getElementById("weatherCard");
  card.classList.remove("hidden");

  // Trigger entrance animation
  card.classList.remove("card-enter");
  void card.offsetWidth;
  card.classList.add("card-enter");

  // City & time
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  updateLocalTime(data.timezone);

  // Temp
  document.getElementById("tempVal").textContent = Math.round(data.main.temp);

  // Icon & description
  const icon = data.weather[0].icon;
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
  document.getElementById("weatherDesc").textContent = capitalise(data.weather[0].description);

  // Stats
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${data.wind.speed} m/s`;
  document.getElementById("feelsLike").textContent = `${Math.round(data.main.feels_like)}°`;
  document.getElementById("visibility").textContent = data.visibility
    ? `${(data.visibility / 1000).toFixed(1)} km`
    : "N/A";

  // Forecast
  renderForecast(forecast.list);

  // Update background
  updateSky(data.weather[0].main, data.sys.sunrise, data.sys.sunset);
}

function renderForecast(list) {
  const row = document.getElementById("forecastRow");
  row.innerHTML = "";

  const daily = list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

  daily.forEach((item, i) => {
    const dayName = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "short" });
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;

    const el = document.createElement("div");
    el.classList.add("fc-card");
    el.style.animationDelay = `${i * 80}ms`;
    el.innerHTML = `
      <span class="fc-day">${dayName}</span>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${item.weather[0].description}" />
      <span class="fc-temp">${temp}°</span>
    `;
    row.appendChild(el);
  });
}

/* ─── Sky / background ───────────────────────── */
function updateSky(condition, sunrise, sunset) {
  const now = Math.floor(Date.now() / 1000);
  const isDay = now >= sunrise && now < sunset;
  const body = document.body;
  const rainContainer = document.getElementById("rainContainer");

  body.className = "";
  rainContainer.innerHTML = "";

  const condLower = condition.toLowerCase();

  if (!isDay) {
    body.classList.add("night");
    generateStars();
  } else if (condLower.includes("thunderstorm")) {
    body.classList.add("storm");
    generateRain(120);
  } else if (condLower.includes("drizzle") || condLower.includes("rain")) {
    body.classList.add("rain");
    generateRain(80);
  } else if (condLower.includes("snow")) {
    body.classList.add("snow");
    generateSnow();
  } else if (condLower.includes("cloud")) {
    body.classList.add("cloudy");
  } else if (condLower.includes("fog") || condLower.includes("mist") || condLower.includes("haze")) {
    body.classList.add("foggy");
  } else {
    body.classList.add("day");
  }
}

function generateRain(count) {
  const container = document.getElementById("rainContainer");
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.classList.add("raindrop");
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.4 + Math.random() * 0.6}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.opacity = `${0.4 + Math.random() * 0.5}`;
    container.appendChild(drop);
  }
}

function generateSnow() {
  const container = document.getElementById("rainContainer");
  for (let i = 0; i < 60; i++) {
    const flake = document.createElement("div");
    flake.classList.add("snowflake");
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.fontSize = `${8 + Math.random() * 14}px`;
    flake.style.animationDuration = `${3 + Math.random() * 5}s`;
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.textContent = "❄";
    container.appendChild(flake);
  }
}

function generateStars() {
  const container = document.getElementById("stars");
  container.innerHTML = "";
  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 60}%`;
    star.style.width = star.style.height = `${1 + Math.random() * 2.5}px`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(star);
  }
}

/* ─── Local time ─────────────────────────────── */
function updateLocalTime(timezoneOffset) {
  const el = document.getElementById("localTime");
  function tick() {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    const local = new Date(utc + timezoneOffset * 1000);
    el.textContent = local.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  tick();
  clearInterval(window._timeTick);
  window._timeTick = setInterval(tick, 1000);
}

/* ─── State helpers ──────────────────────────── */
function showLoading() {
  document.getElementById("weatherCard").classList.add("hidden");
  document.getElementById("errorState").classList.add("hidden");
  document.getElementById("loadingState").classList.remove("hidden");
}

function showError(msg) {
  document.getElementById("weatherCard").classList.add("hidden");
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("errorState").classList.remove("hidden");
  document.getElementById("errorMsg").textContent = msg || "Something went wrong.";
}

function hideStates() {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("errorState").classList.add("hidden");
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
