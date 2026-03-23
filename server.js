const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenWeatherMap API key
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.error('ERROR: OPENWEATHER_API_KEY environment variable is not set.');
  console.error('Get a free API key at https://openweathermap.org/api');
  process.exit(1);
}

// Redis client setup
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const CACHE_DURATION = 1800; // 30 minutes in seconds

const redisClient = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

(async () => {
  await redisClient.connect();
})();

// API proxy endpoint for current weather (with Redis caching)
app.get('/api/weather/current/:city', async (req, res) => {
  try {
    const city = req.params.city.toLowerCase();
    const cacheKey = `weather:current:${city}`;

    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for current weather: ${city}`);
      return res.json(JSON.parse(cached));
    }

    // Cache miss - fetch from API
    console.log(`Cache MISS - fetching current weather for ${city}...`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );

    // Store in cache
    await redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(response.data));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching current weather:', error.message);
    if (error.response && error.response.data) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

// API proxy endpoint for forecast (with Redis caching)
app.get('/api/weather/forecast/:city', async (req, res) => {
  try {
    const city = req.params.city.toLowerCase();
    const cacheKey = `weather:forecast:${city}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for forecast: ${city}`);
      return res.json(JSON.parse(cached));
    }

    console.log(`Cache MISS - fetching forecast for ${city}...`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );

    await redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(response.data));
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

// Static files are served by Nginx - this service only handles API requests

app.listen(PORT, () => {
  console.log(`Weather Dashboard running on port ${PORT}`);
});
