export interface LocationParams {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    uvIndex: number;
    visibility: number;
    weatherCode: number;
    aqi: number;
  };
  daily: {
    time: string[];
    maxTemp: number[];
    minTemp: number[];
    weatherCode: number[];
    sunrise: string[];
    sunset: string[];
    pop: number[];
  };
  hourly: {
    time: string[];
    temp: number[];
    pop: number[];
    weatherCode: number[];
  };
  location: LocationParams;
}

const WMO_CODES: Record<number, { label: string; icon: string; bgClass: string }> = {
  0: { label: 'Clear sky', icon: 'Sun', bgClass: 'from-blue-400 to-blue-200' },
  1: { label: 'Mainly clear', icon: 'Sun', bgClass: 'from-blue-400 to-blue-200' },
  2: { label: 'Partly cloudy', icon: 'CloudSun', bgClass: 'from-blue-400 to-gray-300' },
  3: { label: 'Overcast', icon: 'Cloud', bgClass: 'from-gray-400 to-gray-600' },
  45: { label: 'Fog', icon: 'CloudFog', bgClass: 'from-gray-300 to-gray-500' },
  48: { label: 'Depositing rime fog', icon: 'CloudFog', bgClass: 'from-gray-300 to-gray-500' },
  51: { label: 'Light drizzle', icon: 'CloudDrizzle', bgClass: 'from-blue-300 to-gray-400' },
  53: { label: 'Moderate drizzle', icon: 'CloudDrizzle', bgClass: 'from-blue-300 to-gray-400' },
  55: { label: 'Dense drizzle', icon: 'CloudDrizzle', bgClass: 'from-blue-300 to-gray-400' },
  56: { label: 'Light freezing drizzle', icon: 'CloudSnow', bgClass: 'from-blue-200 to-gray-300' },
  57: { label: 'Dense freezing drizzle', icon: 'CloudSnow', bgClass: 'from-blue-200 to-gray-300' },
  61: { label: 'Slight rain', icon: 'CloudRain', bgClass: 'from-blue-500 to-gray-600' },
  63: { label: 'Moderate rain', icon: 'CloudRain', bgClass: 'from-blue-500 to-gray-600' },
  65: { label: 'Heavy rain', icon: 'CloudRain', bgClass: 'from-blue-600 to-gray-700' },
  66: { label: 'Light freezing rain', icon: 'CloudHail', bgClass: 'from-blue-400 to-gray-500' },
  67: { label: 'Heavy freezing rain', icon: 'CloudHail', bgClass: 'from-blue-400 to-gray-500' },
  71: { label: 'Slight snow fall', icon: 'CloudSnow', bgClass: 'from-blue-100 to-white text-gray-800' },
  73: { label: 'Moderate snow fall', icon: 'CloudSnow', bgClass: 'from-blue-100 to-white text-gray-800' },
  75: { label: 'Heavy snow fall', icon: 'CloudSnow', bgClass: 'from-blue-100 to-white text-gray-800' },
  77: { label: 'Snow grains', icon: 'CloudSnow', bgClass: 'from-blue-100 to-white text-gray-800' },
  80: { label: 'Slight rain showers', icon: 'CloudRain', bgClass: 'from-blue-400 to-gray-500' },
  81: { label: 'Moderate rain showers', icon: 'CloudRain', bgClass: 'from-blue-500 to-gray-600' },
  82: { label: 'Violent rain showers', icon: 'CloudLightning', bgClass: 'from-blue-600 to-gray-800' },
  85: { label: 'Slight snow showers', icon: 'CloudSnow', bgClass: 'from-blue-200 to-white text-gray-800' },
  86: { label: 'Heavy snow showers', icon: 'CloudSnow', bgClass: 'from-blue-200 to-white text-gray-800' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', bgClass: 'from-purple-600 to-gray-900' },
  96: { label: 'Thunderstorm with slight hail', icon: 'CloudLightning', bgClass: 'from-purple-600 to-gray-900' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning', bgClass: 'from-purple-600 to-gray-900' },
};

export const getWeatherDescription = (code: number) => {
  return WMO_CODES[code] || WMO_CODES[0];
};

export async function fetchWeather(location: LocationParams): Promise<WeatherData> {
  const [weatherRes, aqiRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
    ),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi&timezone=auto`
    )
  ]);

  if (!weatherRes.ok || !aqiRes.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const weatherData = await weatherRes.json();
  const aqiData = await aqiRes.json();

  return {
    location,
    current: {
      temp: Math.round(weatherData.current.temperature_2m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      humidity: Math.round(weatherData.current.relative_humidity_2m),
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      windDirection: weatherData.current.wind_direction_10m,
      pressure: Math.round(weatherData.current.surface_pressure),
      uvIndex: weatherData.current.uv_index,
      visibility: weatherData.current.visibility,
      weatherCode: weatherData.current.weather_code,
      aqi: aqiData.current?.us_aqi || 0,
    },
    daily: {
      time: weatherData.daily.time,
      maxTemp: weatherData.daily.temperature_2m_max.map(Math.round),
      minTemp: weatherData.daily.temperature_2m_min.map(Math.round),
      weatherCode: weatherData.daily.weather_code,
      sunrise: weatherData.daily.sunrise,
      sunset: weatherData.daily.sunset,
      pop: weatherData.daily.precipitation_probability_max,
    },
    hourly: {
      time: weatherData.hourly.time,
      temp: weatherData.hourly.temperature_2m.map(Math.round),
      pop: weatherData.hourly.precipitation_probability,
      weatherCode: weatherData.hourly.weather_code,
    }
  };
}

export async function searchCities(query: string): Promise<LocationParams[]> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
  if (!res.ok) throw new Error('Failed to search cities');
  const data = await res.json();
  
  if (!data.results) return [];
  
  return data.results.map((item: any) => ({
    name: item.name,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}
