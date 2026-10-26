const $ = (id) => document.getElementById(id);

const weatherInfo = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snowfall", "🌨️"],
  73: ["Snowfall", "🌨️"],
  75: ["Heavy snowfall", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Severe thunderstorm", "⛈️"]
};

function getWeather(code, isDay = 1) {
  const info = weatherInfo[code] || ["Unknown conditions", "🌡️"];

  if (code === 0 && isDay === 0) {
    return ["Clear night", "🌙"];
  }

  return info;
}

function showStatus(message) {
  $("status").textContent = message;
}

async function getCity(city) {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for this city.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Try another name.");
  }

  return data.results[0];
}

async function getWeather(latitude, longitude) {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise"
    ].join(","),
    forecast_days: "7",
    timezone: "auto"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load weather data.");
  }

  return response.json();
}

function renderWeather(place, data) {
  const current = data.current;
  const daily = data.daily;

  const [description, icon] = getWeather(
    current.weather_code,
    current.is_day
  );

  $("cityName").textContent =
    ${place.name}, ${place.country || ""};

  $("todayDate").textContent =
    new Date(daily.time[0] + "T12:00:00").toLocaleDateString(
      "en", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

  $("condition").textContent = description;
  $("weatherIcon").textContent = icon;

  $("temperature").textContent =
    Math.round(current.temperature_2m);

  $("feels").textContent =
    Math.round(current.apparent_temperature);

  $("high").textContent =
    Math.round(daily.temperature_2m_max[0]);

  $("low").textContent =
    Math.round(daily.temperature_2m_min[0]);

  $("humidity").textContent =
    current.relative_humidity_2m + "%";

  $("wind").textContent =
    Math.round(current.wind_speed_10m);

  $("rain").textContent =
    (daily.precipitation_probability_max[0] ?? 0) + "%";

  $("sunrise").textContent =
    daily.sunrise[0].slice(11, 16);

  $("forecast").replaceChildren();

  daily.time.forEach((date, index) => {
    const [description, icon] =
      getWeather(daily.weather_code[index]);

    const dayName = index === 0
      ? "Today"
      : new Date(date + "T12:00:00").toLocaleDateString(
          "en", { weekday: "short" }
        );

    const card = document.createElement("article");
    card.className = "day";

    const name = document.createElement("div");
    name.className = "day-name";
    name.textContent = dayName;

    const weatherIcon = document.createElement("div");
    weatherIcon.className = "day-icon";
    weatherIcon.textContent = icon;
    weatherIcon.title = description;

    const high = document.createElement("div");
    high.className = "day-temp";
    high.textContent =
      Math.round(daily.temperature_2m_max[index]) + "°";

    const low = document.createElement("div");
    low.className = "day-low";
    low.textContent =
      Math.round(daily.temperature_2m_min[index]) + "°";

    card.append(name, weatherIcon, high, low);
    $("forecast").append(card);
  });
}

async function loadCity(cityName) {
  showStatus("Loading weather...");

  const button = document.querySelector(
    '#searchForm button'
  );

  button.disabled = true;

  try {
    const place = await getCity(cityName);
    const data = await getWeather(
      place.latitude,
      place.longitude
    );

    renderWeather(place, data);

    showStatus("Weather updated successfully.");
  } catch (error) {
    showStatus(error.message || "Something went wrong.");
  } finally {
    button.disabled = false;
  }
}

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const city = $("cityInput").value.trim();

  if (city) {
    loadCity(city);
  }
});

// Load the default city when the app starts.
loadCity("Lahore");