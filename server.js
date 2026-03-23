const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenWeatherMap API key - get your free key at https://openweathermap.org/api
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.error('ERROR: OPENWEATHER_API_KEY environment variable is not set.');
  console.error('Get a free API key at https://openweathermap.org/api');
  console.error('Then set it: export OPENWEATHER_API_KEY=your_key_here');
  process.exit(1);
}

// API proxy endpoint for current weather
app.get('/api/weather/current/:city', async (req, res) => {
  try {
    const city = req.params.city;
    console.log(`Fetching current weather for ${city}...`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching current weather:', error.message);
    if (error.response && error.response.data) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

// API proxy endpoint for forecast
app.get('/api/weather/forecast/:city', async (req, res) => {
  try {
    const city = req.params.city;
    console.log(`Fetching forecast for ${city}...`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    if (error.response && error.response.data) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error fetching forecast data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Weather Dashboard running on port ${PORT}`);
});
