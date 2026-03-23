document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const currentWeatherSection = document.getElementById('current-weather');
    const forecastSection = document.getElementById('forecast');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    // Weather icons mapping
    const weatherIcons = {
      'Clear': 'clear.svg',
      'Clouds': 'clouds.svg',
      'Rain': 'rain.svg',
      'Drizzle': 'drizzle.svg',
      'Thunderstorm': 'thunderstorm.svg',
      'Snow': 'snow.svg',
      'Mist': 'mist.svg',
      'Fog': 'fog.svg',
      'Haze': 'haze.svg',
      'default': 'clouds.svg'
    };
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        searchWeather();
      }
    });
    
    // Initialize with a default city (optional)
    if (localStorage.getItem('lastCity')) {
      cityInput.value = localStorage.getItem('lastCity');
      searchWeather();
    }
    
    // Main search function
    function searchWeather() {
      const city = cityInput.value.trim();
      if (!city) return;
      
      // Save the city to localStorage for persistence
      localStorage.setItem('lastCity', city);
      
      // Show loading indicator and hide other sections
      showLoading();
      
      // Fetch current weather data
      fetchCurrentWeather(city);
      
      // Fetch forecast data
      fetchForecast(city);
    }
    
    // Function to fetch current weather
    function fetchCurrentWeather(city) {
      fetch(`/api/weather/current/${encodeURIComponent(city)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('City not found');
          }
          return response.json();
        })
        .then(data => {
          updateCurrentWeather(data);
        })
        .catch(error => {
          console.error('Error fetching current weather:', error);
          showError();
        });
    }
    
    // Function to fetch forecast
    function fetchForecast(city) {
      fetch(`/api/weather/forecast/${encodeURIComponent(city)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Forecast data not available');
          }
          return response.json();
        })
        .then(data => {
          updateForecast(data);
        })
        .catch(error => {
          console.error('Error fetching forecast:', error);
          // We already show error from current weather if needed
        });
    }
    
    // Function to update current weather UI
    function updateCurrentWeather(data) {
      // Hide loading and error, show weather section
      hideLoading();
      errorMessage.classList.add('hidden');
      currentWeatherSection.classList.remove('hidden');
      
      // Update city and date
      document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
      document.getElementById('current-date').textContent = formatDate(new Date());
      
      // Update weather icon
      const weatherMain = data.weather[0].main;
      const iconPath = `images/weather-icons/${weatherIcons[weatherMain] || weatherIcons.default}`;
      document.getElementById('weather-icon').src = iconPath;
      document.getElementById('weather-icon').alt = data.weather[0].description;
      
      // Update temperature and feels like
      document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
      document.getElementById('feels-like').textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
      
      // Update weather details
      document.getElementById('weather-condition').textContent = data.weather[0].description;
      document.getElementById('humidity').textContent = `${data.main.humidity}%`;
      document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
      document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    }
    
    // Function to update forecast UI
    function updateForecast(data) {
      forecastSection.classList.remove('hidden');
      const forecastContainer = document.getElementById('forecast-items');
      forecastContainer.innerHTML = '';
      
      // Group forecast by day (one data point per day at noon)
      const dailyForecasts = {};
      
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toDateString();
        
        // Only take readings around noon (to get daily averages)
        const hour = date.getHours();
        if (hour >= 11 && hour <= 13 && !dailyForecasts[day]) {
          dailyForecasts[day] = item;
        }
      });
      
      // Convert to array and take first 5 days
      const forecasts = Object.values(dailyForecasts).slice(0, 5);
      
      // Create forecast items
      forecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const weatherMain = item.weather[0].main;
        const iconPath = `images/weather-icons/${weatherIcons[weatherMain] || weatherIcons.default}`;
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
          <div class="forecast-date">${formatDateShort(date)}</div>
          <img class="forecast-icon" src="${iconPath}" alt="${item.weather[0].description}">
          <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
          <div class="forecast-condition">${item.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
      });
    }
    

    // Helper functions
    function showLoading() {
      loadingIndicator.classList.remove('hidden');
      currentWeatherSection.classList.add('hidden');
      forecastSection.classList.add('hidden');
      errorMessage.classList.add('hidden');
    }
    
    function hideLoading() {
      loadingIndicator.classList.add('hidden');
    }
    
    function showError() {
      hideLoading();
      errorMessage.classList.remove('hidden');
      currentWeatherSection.classList.add('hidden');
      forecastSection.classList.add('hidden');
    }
    
    function formatDate(date) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
    
    function formatDateShort(date) {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
    
  });