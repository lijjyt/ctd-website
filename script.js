  // Get DOM elements
  const submitButton = document.getElementById('submitButton');
  const locationInput = document.getElementById('locationInput');
  const coordinatesContainer = document.getElementById('coordinatesContainer');
  const errorContainer = document.getElementById('errorContainer');

// Check if the submit button exists
if (submitButton) {
  // Add event listener to the submit button
  submitButton.addEventListener('click', convertInputToCoordinates);

  locationInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      convertInputToCoordinates();
    }
  });
}

// Function to check if the input is in coordinate format
function isCoordinate(input) {
  return /^[-]?\d+(\.\d+)?,[-]?\d+(\.\d+)?$/.test(input);
}

// Function to convert input to coordinates
async function convertInputToCoordinates() {
  let latitude = null;
  let longitude = null;
  const input = locationInput.value.trim();

  if (isCoordinate(input)) {
    // Use the entered coordinates directly
    const [latitude, longitude] = input.split(',');
    const coordinates = { lat: latitude, lng: longitude };
    displayResult(coordinates);
  } else {
    try {
    // Convert the entered address to coordinates
    const apiKey = 'xQeoyuZfZgd79orhEFjy928ZJAMVbX9k';
    const geocodingUrl = `http://www.mapquestapi.com/geocoding/v1/address?key=${apiKey}&location=${encodeURIComponent(input)}`;
    const response = await fetch(geocodingUrl);
    const data = await response.json();
      //check for valid address
      if (data.results.length > 0 && data.results[0].locations[0].geocodeQualityCode !== "A1XAX") {
        
        const { lat, lng } = data.results[0].locations[0].latLng;
        const coordinates = { lat, lng };
        displayResult(coordinates);
      } else {
        displayError('No coordinates found for the provided address.');
        }
    } catch (error) { 
    displayError('An error occurred during the address conversion.');
    console.log('An error occurred:', error);
      }
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
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&windspeed_unit=mph&timezone=auto&temperature_unit=fahrenheit&daily=weathercode&current_weather=true&hourly=relativehumidity_2m,uv_index`);

    // Process the response and extract relevant data
    const data = await response.json();
    console.log('API response:', data);
    const currentWeather = data.current_weather;
    const hours = data.hourly.time;
    const hourlyHumidity = data.hourly.relativehumidity_2m;
    const hourlyUv = data.hourly.uv_index;

    // Call a function to render the weather information on the page
    renderWeatherData(currentWeather, hours, hourlyUv, hourlyHumidity, coordinates);
  } catch (error) {
    console.log('Error fetching weather data:', error);
  }
}

function getTime(hours) {
  // Get the current date and time
  const currentTime = new Date();

  // Get the current hour
  const currentHour = currentTime.getHours();

  // Find the index of the closest time in the hours array
  const closestTimeIndex = hours.findIndex(time => {
    // Parse the time in the hours array to get its hour
    const timeInArray = new Date(time);
    const hourInArray = timeInArray.getHours();

    // Check if the current hour and hour in the array are the same
    return currentHour === hourInArray;
  });

  // Return the corresponding index
  return closestTimeIndex;
}

// Function to render the weather information on the page
function renderWeatherData(weatherData,hours, hourlyUv, hourlyHumidity, coordinates) {
  const closestTimeIndex = getTime(hours);
  // Access the DOM element to display the weather information
  const weatherContainer = document.getElementById('weather-container');
  // Create HTML markup to display the weather data
  const html = `
      <div class="weather-info">
          <h3 class="temperature"> Temperature: ${weatherData.temperature}°F</h3>
          <p class="weathercode">Weather: ${getWeatherDescription(weatherData.weathercode)}</p>
          <p class="humidity"> Humidity: ${hourlyHumidity[getTime(hours)]}%</p>
          <p class="wind">Wind: ${weatherData.windspeed} mph</p>
          <p class="uv"> UV index: ${hourlyUv[getTime(hours)]}</p>
          </div>
  `;

  // Set the HTML content of the weather container
  weatherContainer.innerHTML = html;

  // Call the function to fetch and display the forecast data
  getForecastData(coordinates);

  aqi(coordinates, hours);
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
  const hours = hourlyForecast.time;


  // Access the DOM element to display the forecast table
  const forecastContainer = document.getElementById('forecast-container');

  // Create the forecast table markup
  const table = document.createElement('table');
  table.classList.add('forecast-table');
  table.id = 'forecast-table';

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

  const currentIndex = getTime(hours);

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

  const moreContainer = document.getElementById('more-container');
  // link to daily forecast html page
  const html = `
      <div class="daily-link">
        <a href="daily.html?lat=${coordinates.lat}&lng=${coordinates.lng}">View Daily Forecast</a>
      </div>
  `;
  // Set the HTML content of the weather container
  moreContainer.innerHTML = html;

} catch (error) {
  console.log('Error fetching forecast data:', error);
}
}

async function aqi(coordinates, hours) {
  try {
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates.lat}&longitude=${coordinates.lng}&hourly=us_aqi`);

    const data = await response.json();
    console.log('API response:', data);
    const aqi = data.hourly.us_aqi;

    // Get the index of the closest time
    const closestTimeIndex = getTime(hours);

    // Get the AQI value for the current hour
    const currentAQI = aqi[closestTimeIndex];

    // Display a descriptive message for the AQI value
    let aqiMessage;
    if (currentAQI <= 50) {
      aqiMessage = 'Good';
    } else if (currentAQI <= 100) {
      aqiMessage = 'Moderate';
    } else if (currentAQI <= 150) {
      aqiMessage = 'Unhealthy for Sensitive Groups';
    } else if (currentAQI <= 200) {
      aqiMessage = 'Unhealthy';
    } else if (currentAQI <= 300) {
      aqiMessage = 'Very Unhealthy';
    } else {
      aqiMessage = 'Hazardous';
    }

    // Access the DOM element to display the AQI information
    const aqiContainer = document.getElementById('air-quality-container');

    // Create HTML markup to display the AQI data
    const html = `
      <div class="aqi-info">
        <p>AQI: ${currentAQI}</p>
        <p>${aqiMessage}</p>
      </div>
    `;

    aqiContainer.innerHTML = html;
  } catch (error) {
    console.log('Error fetching AQI data:', error);
  }
}

//function for getting daily forecast data and populating table with data
async function getDailyForecast(coordinates) {
  try {
    if (coordinates) {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&daily=uv_index_max,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`);
      const data = await response.json();
      console.log('API response (Daily Forecast):', data);
      const dailyForecast = data.daily;
      const dailyContainer = document.getElementById('daily-container');
      
      // Create the daily forecast table markup
      const table = document.createElement('table');
      table.classList.add('daily-forecast-table');
      table.id = "daily-forecast-table";

      // Create the table header row
      const headerRow = document.createElement('tr');
      const headerDateCell = document.createElement('th');
      headerDateCell.textContent = 'Date';
      headerRow.appendChild(headerDateCell);

      const headerMaxTemperatureCell = document.createElement('th');
      headerMaxTemperatureCell.textContent = 'Max Temperature (°F)';
      headerRow.appendChild(headerMaxTemperatureCell);

      const headerMinTemperatureCell = document.createElement('th');
      headerMinTemperatureCell.textContent = 'Min Temperature (°F)';
      headerRow.appendChild(headerMinTemperatureCell);

      const headerUvCell = document.createElement('th');
      headerUvCell.textContent = 'Max UV Index';
      headerRow.appendChild(headerUvCell);

      table.appendChild(headerRow);

      // Get the current date
      const currentDate = new Date();
      const currentDateString = currentDate.toISOString().split('T')[0];

      // Find the index of the current date in the response data
      const currentIndex = dailyForecast.time.indexOf(currentDateString);
      console.log (currentDateString);

      // Iterate over the daily forecast data starting from the current date index
      for (let i = currentIndex; i < dailyForecast.time.length; i++) {
        const date = new Date(dailyForecast.time[i]);
        const formattedDate = date.toISOString().split('T')[0];
        const maxTemp = dailyForecast.temperature_2m_max[i];
        const minTemp = dailyForecast.temperature_2m_min[i];
        const uv = dailyForecast.uv_index_max[i];

        // Create a table row for each day's forecast
        const row = document.createElement('tr');
        const dateCell = document.createElement('td');
        dateCell.textContent = formattedDate;
        row.appendChild(dateCell);

        const maxTempCell = document.createElement('td');
        maxTempCell.textContent = maxTemp;
        row.appendChild(maxTempCell);

        const minTempCell = document.createElement('td');
        minTempCell.textContent = minTemp;
        row.appendChild(minTempCell);

        const uvCell = document.createElement('td');
        uvCell.textContent = uv;
        row.appendChild(uvCell);

        table.appendChild(row);
      }

      // Clear any previous daily forecast data
      dailyContainer.innerHTML = '';
      
      // Append the daily forecast table to the daily forecast container
      dailyContainer.appendChild(table);
    } else {
      console.log('Error: Coordinates not found.');
    }
  } catch (error) {
    console.log('Error fetching daily forecast data:', error);
  }
}

if (window.location.pathname.includes('daily.html')) {
  // Call the function to populate the daily forecast when the daily.html page loads
  document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);

  const coordinates = {lat: urlParams.get('lat'), lng: urlParams.get('lng')};
  console.log (coordinates);
  getDailyForecast(coordinates);
  
  });
}
  
  
  
