import React from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudHail,
  Moon,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Eye,
  SunDim
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getWeatherDescription } from '../services/weather';

interface WeatherIconProps {
  code: number;
  className?: string;
  isNight?: boolean;
}

export function WeatherIcon({ code, className, isNight = false }: WeatherIconProps) {
  const { icon } = getWeatherDescription(code);

  const iconMap: Record<string, React.ReactNode> = {
    Sun: isNight ? <Moon className={cn('text-blue-200', className)} /> : <Sun className={cn('text-yellow-400', className)} />,
    CloudSun: isNight ? <Cloud className={cn('text-gray-300', className)} /> : <CloudSun className={cn('text-gray-200', className)} />,
    Cloud: <Cloud className={cn('text-gray-400', className)} />,
    CloudFog: <CloudFog className={cn('text-gray-400', className)} />,
    CloudDrizzle: <CloudDrizzle className={cn('text-blue-300', className)} />,
    CloudRain: <CloudRain className={cn('text-blue-400', className)} />,
    CloudLightning: <CloudLightning className={cn('text-purple-400', className)} />,
    CloudSnow: <CloudSnow className={cn('text-white', className)} />,
    CloudHail: <CloudHail className={cn('text-blue-200', className)} />,
  };

  return iconMap[icon] || <Sun className={className} />;
}
