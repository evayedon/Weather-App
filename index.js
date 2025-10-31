const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const submitBtn = weatherForm.querySelector("button[type='submit']");
const locationBtn = document.querySelector(".locationBtn");
const unitBtns = document.querySelectorAll(".unitBtn");
const apiKey = "bab8e3be2770adeaf6791eadaced5fa0";

let currentUnit = "celsius";
let currentWeatherData = null;
let recentCities = [];

// Load recent searches
loadRecentSearches();

weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) {
        displayError("Please enter a city name");
        return;
    }

    await fetchWeather(city);
});

locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        locationBtn.textContent = "⏳";
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                locationBtn.textContent = "📍";
                await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                locationBtn.textContent = "📍";
                displayError("Unable to get your location. Please enter a city manually.");
            }
        );
    } else {
        displayError("Geolocation is not supported by your browser.");
    }
});

unitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        unitBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentUnit = btn.dataset.unit;
        if (currentWeatherData) {
            displayWeatherInfo(currentWeatherData);
        }
    });
});

async function fetchWeather(city) {
    try {
        showLoading();
        const weatherData = await getWeatherData(city);
        currentWeatherData = weatherData;
        displayWeatherInfo(weatherData);
        addToRecentSearches(city);
    } catch (error) {
        console.error(error);
        displayError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        const weatherData = await getWeatherDataByCoords(lat, lon);
        currentWeatherData = weatherData;
        displayWeatherInfo(weatherData);
        cityInput.value = weatherData.name;
        addToRecentSearches(weatherData.name);
    } catch (error) {
        console.error(error);
        displayError(error.message);
    }
}

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    return await fetchWeatherAPI(apiUrl);
}

async function getWeatherDataByCoords(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    return await fetchWeatherAPI(apiUrl);
}

async function fetchWeatherAPI(apiUrl) {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found. Please check the spelling and try again.");
        } else if (response.status === 401) {
            throw new Error("API key is activating. New keys take 10-20 minutes to work. Please wait and try again.");
        } else {
            throw new Error(`Error ${response.status}: Unable to fetch weather data. Please try again later.`);
        }
    }
    
    return await response.json();
}

function showLoading() {
    card.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    `;
    card.style.display = "flex";
    submitBtn.disabled = true;
}

function displayWeatherInfo(data) {
    const {
        name: city,
        main: { temp, humidity, feels_like, pressure },
        weather: [{ description, id }],
        wind: { speed },
        visibility,
        sys: { sunrise, sunset, country }
    } = data;

    const { temp: displayTemp, feelsLike } = convertTemp(temp, feels_like);
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const sunsetTime = new Date(sunset * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    card.innerHTML = `
        <h1 class="cityDisplay">${city}, ${country}</h1>
        <p class="dateDisplay">${currentDate}</p>
        <p class="weatherEmoji">${getWeatherEmoji(id)}</p>
        <p class="tempDisplay">${displayTemp}°</p>
        <p class="descripDisplay">${description}</p>
        <div class="detailsContainer">
            <div class="detail">
                <div class="detailIcon">🌡️</div>
                <div class="detailLabel">Feels Like</div>
                <div class="detailValue">${feelsLike}°</div>
            </div>
            <div class="detail">
                <div class="detailIcon">💧</div>
                <div class="detailLabel">Humidity</div>
                <div class="detailValue">${humidity}%</div>
            </div>
            <div class="detail">
                <div class="detailIcon">💨</div>
                <div class="detailLabel">Wind Speed</div>
                <div class="detailValue">${speed} m/s</div>
            </div>
        </div>
        <div class="additionalInfo">
            <div class="infoItem">
                <span>🔆</span>
                <div>
                    <div class="infoLabel">Pressure</div>
                    <div class="infoValue">${pressure} hPa</div>
                </div>
            </div>
            <div class="infoItem">
                <span>👁️</span>
                <div>
                    <div class="infoLabel">Visibility</div>
                    <div class="infoValue">${(visibility / 1000).toFixed(1)} km</div>
                </div>
            </div>
            <div class="infoItem">
                <span>🌅</span>
                <div>
                    <div class="infoLabel">Sunrise</div>
                    <div class="infoValue">${sunriseTime}</div>
                </div>
            </div>
            <div class="infoItem">
                <span>🌇</span>
                <div>
                    <div class="infoLabel">Sunset</div>
                    <div class="infoValue">${sunsetTime}</div>
                </div>
            </div>
        </div>
    `;
    
    card.style.display = "flex";
    submitBtn.disabled = false;
}

function convertTemp(temp, feelsLike) {
    if (currentUnit === "celsius") {
        return {
            temp: (temp - 273.15).toFixed(1),
            feelsLike: (feelsLike - 273.15).toFixed(1)
        };
    } else {
        return {
            temp: ((temp - 273.15) * 9/5 + 32).toFixed(1),
            feelsLike: ((feelsLike - 273.15) * 9/5 + 32).toFixed(1)
        };
    }
}

function getWeatherEmoji(weatherId) {
    switch (true) {
        case (weatherId >= 200 && weatherId < 300):
            return "⛈️";
        case (weatherId >= 300 && weatherId < 400):
            return "🌦️";
        case (weatherId >= 500 && weatherId < 600):
            return "🌧️";
        case (weatherId >= 600 && weatherId < 700):
            return "❄️";
        case (weatherId >= 700 && weatherId < 800):
            return "🌫️";
        case (weatherId === 800):
            return "☀️";
        case (weatherId >= 801 && weatherId < 810):
            return "☁️";
        default:
            return "🌡️";
    }
}

function displayError(message) {
    card.innerHTML = `
        <p class="errorIcon">⚠️</p>
        <p class="errorDisplay">${message}</p>
    `;
    card.style.display = "flex";
    submitBtn.disabled = false;
}

function addToRecentSearches(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) {
            recentCities.pop();
        }
        saveRecentSearches();
        displayRecentSearches();
    }
}

function saveRecentSearches() {
    const cities = {};
    recentCities.forEach((city, i) => {
        cities[`city_${i}`] = city;
    });
}

function loadRecentSearches() {
    // In a real app with storage, load from storage here
    displayRecentSearches();
}

function displayRecentSearches() {
    const container = document.getElementById("recentCities");
    const recentSection = document.getElementById("recentSearches");
    
    if (recentCities.length > 0) {
        recentSection.style.display = "block";
        container.innerHTML = recentCities.map(city => 
            `<button class="recentCity" onclick="searchCity('${city}')">${city}</button>`
        ).join('');
    }
}

function searchCity(city) {
    cityInput.value = city;
    fetchWeather(city);
}


window.searchCity = searchCity;
