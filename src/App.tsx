import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Thermometer, Droplets, Wind, Gauge, Eye, SunDim, Sun, Sparkles } from 'lucide-react';
import { fetchWeather, searchCities, LocationParams, WeatherData, getWeatherDescription } from './services/weather';
import { WeatherIcon } from './components/WeatherIcon';
import { GlassCard } from './components/GlassCard';
import { format, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const NexusLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    {/* Nexus network inside the cloud */}
    <circle cx="12" cy="10" r="1.5" fill="currentColor" />
    <circle cx="9" cy="14" r="1.5" fill="currentColor" />
    <circle cx="15" cy="14" r="1.5" fill="currentColor" />
    <path d="M12 10l-3 4" />
    <path d="M12 10l3 4" />
    <path d="M9 14h6" />
  </svg>
);

const DEFAULT_LOCATION: LocationParams = {
  name: 'London',
  country: 'United Kingdom',
  latitude: 51.5085,
  longitude: -0.1257
};

export default function App() {
  const [location, setLocation] = useState<LocationParams>(DEFAULT_LOCATION);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationParams[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadWeatherData(location);
  }, [location]);

  const loadWeatherData = async (loc: LocationParams) => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await fetchWeather(loc);
      setData(weatherData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchCities(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (loc: LocationParams) => {
    setLocation(loc);
    setQuery('');
    setSearchResults([]);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          name: 'Current Location',
          latitude,
          longitude
        });
      },
      (error) => {
        alert('Unable to retrieve your location');
      }
    );
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    );
  }

  const isNight = data ? (
    new Date().getHours() < parseInt(data.daily.sunrise[0]?.split('T')[1]?.split(':')[0] || '6') ||
    new Date().getHours() > parseInt(data.daily.sunset[0]?.split('T')[1]?.split(':')[0] || '18')
  ) : false;

  // The base background classes can be overwritten by dynamic weather backgrounds if needed,
  // but for the Frosted Glass theme, we use the specified gradient.
  const bgClass = 'from-indigo-900 via-blue-800 to-teal-700';

  const hourlyChartData = data?.hourly.time.slice(0, 24).map((time, i) => ({
    time: format(parseISO(time), 'HH:mm'),
    temp: data.hourly.temp[i],
  })) || [];

  return (
    <div className={`relative min-h-screen transition-colors duration-1000 bg-gradient-to-br ${bgClass} text-white p-4 md:p-8 font-sans overflow-x-hidden`}>
      {/* Background Mesh Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-[100] font-medium shadow-lg">
          No internet connection. Please check your network.
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header & Search */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-50">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30 text-yellow-300">
               <NexusLogo className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">Nexus<span className="font-light">Weather</span></h1>
          </div>

          <div className="flex-1 max-w-md relative w-full">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search city..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-full py-2 px-10 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/60 transition-all duration-300"
              />
              <Search className="absolute left-4 top-2.5 h-5 w-5 text-white/60" />
            </form>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full z-50"
                >
                  <GlassCard className="bg-slate-900/80 p-2">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-between group"
                        onClick={() => handleLocationSelect(res)}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                          <span className="font-medium text-white">{res.name}</span>
                          {res.country && <span className="text-sm text-white/50">, {res.country}</span>}
                        </div>
                      </button>
                    ))}
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleGeolocate}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-full transition-all duration-300 flex items-center gap-2"
            title="Current Location"
          >
            <MapPin className="w-5 h-5" />
            <span className="hidden md:block text-sm font-medium pr-2">Locate Me</span>
          </button>
        </header>

        {error && (
          <div className="bg-red-500/20 text-red-100 p-4 rounded-2xl backdrop-blur-md border border-red-500/50">
            {error}
          </div>
        )}

        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            
            {/* Left Column: Current Weather */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard variant="hero" className="p-8 relative flex flex-col items-center text-center group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <WeatherIcon code={data.current.weatherCode} isNight={isNight} className="w-48 h-48" />
                </div>
                
                <h2 className="text-3xl font-light mb-1 relative z-10">{data.location.name}</h2>
                {data.location.country && <p className="text-blue-100 mb-8 relative z-10">{data.location.country}</p>}
                
                <div className="flex items-end gap-4 mb-6 relative z-10">
                  <span className="text-8xl font-thin tracking-tighter">{data.current.temp}°</span>
                </div>
                
                <div className="text-2xl font-medium mb-1 relative z-10">
                  {getWeatherDescription(data.current.weatherCode).label}
                </div>
                <div className="flex gap-4 text-blue-100 text-sm font-medium mb-8 relative z-10">
                  <span>H: {data.daily.maxTemp[0]}°</span>
                  <span className="opacity-40">|</span>
                  <span>L: {data.daily.minTemp[0]}°</span>
                </div>
                
                <div className="w-full flex justify-between items-center bg-black/10 rounded-2xl p-4 border border-white/5 relative z-10">
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Feels Like</p>
                    <p className="text-lg font-bold">{data.current.feelsLike}°</p>
                  </div>
                </div>
              </GlassCard>

            </div>

            {/* Right Column: Details & Forecasts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Hourly Forecast Chart */}
              <GlassCard variant="panel" className="p-6">
                <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold mb-6 flex items-center gap-2">
                  <Thermometer className="w-5 h-5" /> Hourly Forecast
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyChartData}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fff" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#ffffff80" tick={{fill: '#ffffff80', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="temp" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Highlights Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Wind className="w-4 h-4"/> Wind Status</div>
                  <div>
                    <span className="text-2xl font-bold">{data.current.windSpeed}</span>
                    <span className="text-sm font-normal text-white/60 ml-1">km/h</span>
                  </div>
                </GlassCard>
                
                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Droplets className="w-4 h-4"/> Humidity</div>
                  <div>
                    <span className="text-2xl font-bold">{data.current.humidity}</span>
                    <span className="text-sm font-normal text-white/60 ml-1">%</span>
                  </div>
                </GlassCard>

                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                   <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Eye className="w-4 h-4"/> Visibility</div>
                  <div>
                    <span className="text-2xl font-bold">{(data.current.visibility / 1000).toFixed(1)}</span>
                    <span className="text-sm font-normal text-white/60 ml-1">km</span>
                  </div>
                </GlassCard>

                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><SunDim className="w-4 h-4"/> UV Index</div>
                  <div>
                    <span className="text-2xl font-bold">{data.current.uvIndex} <span className="text-sm font-normal text-white/60"></span></span>
                  </div>
                </GlassCard>

                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Gauge className="w-4 h-4"/> Pressure</div>
                  <div>
                    <span className="text-2xl font-bold">{data.current.pressure}</span>
                    <span className="text-sm font-normal text-white/60 ml-1">hPa</span>
                  </div>
                </GlassCard>

                <GlassCard variant="widget" className="p-5 flex flex-col justify-between">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Air Quality</div>
                  <div>
                    <span className="text-2xl font-bold">{data.current.aqi}</span>
                  </div>
                </GlassCard>

                <GlassCard variant="widget" className="p-5 flex flex-col justify-between col-span-2 lg:col-span-3">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Sun className="w-4 h-4"/> Sunrise & Sunset</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex-1">
                      <p className="text-xl font-bold">{data.daily.sunrise[0] ? format(parseISO(data.daily.sunrise[0]), 'HH:mm') : '--:--'}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-400/20 rounded-full flex items-center justify-center border border-orange-400/30 text-orange-300">
                      ☀
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xl font-bold">{data.daily.sunset[0] ? format(parseISO(data.daily.sunset[0]), 'HH:mm') : '--:--'}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* 7-Day Forecast */}
              <GlassCard variant="panel" className="p-6">
                <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold mb-4">7-Day Forecast</h3>
                <div className="space-y-4">
                  {data.daily.time.map((dateStr, i) => (
                    <div key={dateStr} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="w-24 text-white/80">
                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(parseISO(dateStr), 'EEEE')}
                      </div>
                      <div className="flex items-center gap-3 w-32 justify-center">
                        <WeatherIcon code={data.daily.weatherCode[i]} className="w-6 h-6" />
                        <span className="text-sm font-medium">{data.daily.pop?.[i] > 0 ? `${data.daily.pop[i]}%` : ''}</span>
                      </div>
                      <div className="w-32 flex justify-end gap-3 font-mono">
                        <span className="text-white/60">{data.daily.minTemp[i]}°</span>
                        <div className="w-16 h-1.5 bg-white/20 rounded-full my-auto overflow-hidden">
                           <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-red-400" 
                              style={{ width: '100%', opacity: 0.8 }} 
                           />
                        </div>
                        <span className="font-semibold">{data.daily.maxTemp[i]}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
