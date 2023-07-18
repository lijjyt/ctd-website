// Get DOM elements
const submitButton = document.getElementById('submitButton');
const locationInput = document.getElementById('locationInput');
const resultContainer = document.getElementById('resultContainer');

// Add event listener to the submit button
submitButton.addEventListener('click', convertInputToCoordinates);

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

// Function to check if the input is in coordinate format
function isCoordinate(input) {
  return /^[-]?\d+(\.\d+)?,[-]?\d+(\.\d+)?$/.test(input);
}

// Function to display the converted coordinates
function displayResult(coordinates) {
  resultContainer.textContent = `Coordinates: ${coordinates.lat}, ${coordinates.lng}`;
}

// Function to display an error message
function displayError(message) {
  resultContainer.textContent = `Error: ${message}`;
}
