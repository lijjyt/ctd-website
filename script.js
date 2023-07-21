// Get DOM elements
const submitButton = document.getElementById('submitButton');
const locationInput = document.getElementById('locationInput');
const coordinatesContainer = document.getElementById('coordinatesContainer');
const errorContainer = document.getElementById('errorContainer');

// Add event listener to the submit button
submitButton.addEventListener('click', convertInputToCoordinates);

// Function to check if the input is in coordinate format
function isCoordinate(input) {
  return /^[-]?\d+(\.\d+)?,[-]?\d+(\.\d+)?$/.test(input);
}

// Function to convert input to coordinates
function convertInputToCoordinates() {
  const input = locationInput.value.trim();

  if (isCoordinate(input)) {
    // Use the entered coordinates directly
    const [latitude, longitude] = input.split(',');
    const coordinates = { lat: latitude, lng: longitude };
    displayResult(coordinates);
  } else {
    // Convert the entered address to coordinates
    const apiKey = 'xQeoyuZfZgd79orhEFjy928ZJAMVbX9k';
    const geocodingUrl = `http://www.mapquestapi.com/geocoding/v1/address?key=${apiKey}&location=${encodeURIComponent(input)}`;

    fetch(geocodingUrl)
      .then(response => response.json())
      .then(data => {
        if (data.results.length > 0) {
          const { lat, lng } = data.results[0].locations[0].latLng;
          const coordinates = { lat, lng };
          displayResult(coordinates);
        } else {
          displayError('No coordinates found for the provided address.');
        }
      })
      .catch(error => {
        displayError('An error occurred during the address conversion.');
        console.log('An error occurred:', error);
      });
  }
}

// Function to display the converted coordinates and fetch weather information
function displayResult(coordinates) {
    coordinatesContainer.textContent = `Coordinates: ${coordinates.lat}, ${coordinates.lng}`;
    errorContainer.textContent = ''; // Clear any previous error message

    // Call the function to fetch weather information using the coordinates
    getWeatherData(coordinates)
      .catch(error => {
        displayError('An error occurred while fetching weather data.');
        console.log('An error occurred:', error);
      });
}


// Function to fetch weather data from Open-Meteo API
async function getWeatherData(coordinates) {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&windspeed_unit=mph&timezone=auto&temperature_unit=fahrenheit&daily=weathercode,uv_index_max&current_weather=true&hourly=relativehumidity_2m,uv_index`);

    // Process the response and extract relevant data
    const data = await response.json();
    console.log('API response:', data);
    const currentWeather = data.current_weather;
    const hourlyHumidity = data.hourly.relativehumidity_2m;

    // Call a function to render the weather information on the page
    renderWeatherData(currentWeather, hourlyHumidity, coordinates);
  } catch (error) {
    console.log('Error fetching weather data:', error);
  }
}
  

// Function to render the weather information on the page
function renderWeatherData(weatherData, hourlyHumidity, coordinates) {
  // Access the DOM element to display the weather information
  const weatherContainer = document.getElementById('weather-container');
  // Create HTML markup to display the weather data
  const html = `
      <div class="weather-info">
          <h3 class="temperature"> Temperature: ${weatherData.temperature}°F</h3>
          <p class="weathercode">Weather: ${getWeatherDescription(weatherData.weathercode)}</p>
          <p class="humidity"> Humidity: ${getCurrentHumidity(hourlyHumidity)}%</p>
          <p class="wind">Wind: ${weatherData.windspeed} mph</p>
          <p class="uv">UV: ${weatherData.daily?.uv_index_max[0]}</p>
          </div>
  `;

  // Set the HTML content of the weather container
  weatherContainer.innerHTML = html;

  // Call the function to fetch and display the forecast data
  getForecastData(coordinates);
}

function getWeatherDescription(weatherCode) {
  const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    95: 'Thunderstorm',
  };

  return weatherDescriptions[weatherCode] || 'Unknown';
}


function getCurrentHumidity(hourlyHumidity) {
  // Get the current date and time in the format "YYYY-MM-DDTHH:mm"
  const currentTime = new Date().toISOString().slice(0, 16);

  // Find the index of the closest time in the hourly humidity data
  const closestTimeIndex = hourlyHumidity.findIndex((data) => data.time === currentTime);

  // Return the corresponding humidity value for the closest time
  return closestTimeIndex !== -1 ? hourlyHumidity[closestTimeIndex].relativehumidity_2m + '%' : 'N/A';
}

// Function to display an error message
function displayError(message) {
    coordinatesContainer.textContent = ''; // Clear any previous coordinates
    errorContainer.textContent = `Error: ${message}`;
}

//Get the time relevant forecast data and create a table for 6 hours
async function getForecastData(coordinates) {
try {
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&timezone=auto&temperature_unit=fahrenheit&hourly=temperature_2m,precipitation_probability&interval=6h`);

  // Process the response and extract relevant data
  const data = await response.json();
  console.log('API response:', data);
  const hourlyForecast = data.hourly;
  const temperature = hourlyForecast.temperature_2m;
  const precipitation = hourlyForecast.precipitation_probability;

  // Access the DOM element to display the forecast table
  const forecastContainer = document.getElementById('forecast-container');

  // Create the forecast table markup
  const table = document.createElement('table');
  table.classList.add('forecast-table');

  // Create the table header row
  const headerRow = document.createElement('tr');
  const headerTimeCell = document.createElement('th');
  headerTimeCell.textContent = 'Time';
  headerRow.appendChild(headerTimeCell);

  const headerTemperatureCell = document.createElement('th');
  headerTemperatureCell.textContent = 'Temperature (°F)';
  headerRow.appendChild(headerTemperatureCell);

  const headerPrecipitationCell = document.createElement('th');
  headerPrecipitationCell.textContent = 'Precipitation (%)';
  headerRow.appendChild(headerPrecipitationCell);

  table.appendChild(headerRow);

  // Find the current hour index
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentIndex = hourlyForecast.time.findIndex(time => {
    const forecastTime = new Date(time);
    return forecastTime.getHours() > currentHour;
  });

  // If the current hour is the last in the forecast, start from the beginning
  const nextIndex = currentIndex === -1 ? 0 : currentIndex;

  // Iterate over the next 6 hours' forecast data
  for (let i = nextIndex; i < nextIndex + 6; i++) {
    const time = hourlyForecast.time[i];
    const formattedTime = new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
    const temp = temperature[i];
    const precip = precipitation[i];

    // Create a table row for each forecast hour
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    timeCell.textContent = formattedTime;
    row.appendChild(timeCell);

    const temperatureCell = document.createElement('td');
    temperatureCell.textContent = temp;
    row.appendChild(temperatureCell);

    const precipitationCell = document.createElement('td');
    precipitationCell.textContent = precip;
    row.appendChild(precipitationCell);

    table.appendChild(row);
  }

  // Clear any previous forecast data
  forecastContainer.innerHTML = '';

  // Append the forecast table to the forecast container
  forecastContainer.appendChild(table);
} catch (error) {
  console.log('Error fetching forecast data:', error);
}
}

