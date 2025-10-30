const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const submitBtn = weatherForm.querySelector("button");
const apiKey = "0e321834c423eb149a6c97c3b0139837";

weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) {
        displayError("Please enter a city name");
        return;
    }

    try {
        showLoading();
        const weatherData = await getWeatherData(city);
        displayWeatherInfo(weatherData);
    } catch (error) {
        console.error(error);
        displayError(error.message);
    }
});

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found. Please check the spelling and try again.");
        } else if (response.status === 401) {
            throw new Error("API key error. Please contact support.");
        } else {
            throw new Error("Unable to fetch weather data. Please try again later.");
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
        main: { temp, humidity, feels_like },
        weather: [{ description, id }],
        wind: { speed }
    } = data;

    const tempCelsius = (temp - 273.15).toFixed(1);
    const feelsLikeCelsius = (feels_like - 273.15).toFixed(1);

    card.innerHTML = `
        <h1 class="cityDisplay">${city}</h1>
        <p class="weatherEmoji">${getWeatherEmoji(id)}</p>
        <p class="tempDisplay">${tempCelsius}°C</p>
        <p class="descripDisplay">${description}</p>
        <div class="detailsContainer">
            <div class="detail">
                <div class="detailLabel">Feels Like</div>
                <div class="detailValue">${feelsLikeCelsius}°C</div>
            </div>
            <div class="detail">
                <div class="detailLabel">Humidity</div>
                <div class="detailValue">${humidity}%</div>
            </div>
            <div class="detail">
                <div class="detailLabel">Wind Speed</div>
                <div class="detailValue">${speed} m/s</div>
            </div>
        </div>
    `;
    
    card.style.display = "flex";
    submitBtn.disabled = false;
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

// Optional: Search on Enter key
cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        weatherForm.dispatchEvent(new Event("submit"));
    }
});
