"use client"

import * as React from "react"
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Droplets, Eye } from "lucide-react"

interface WeatherData {
  current: {
    temp: number
    condition: string
    humidity: number
    windSpeed: number
    visibility: number
    icon: string
  }
  forecast: Array<{
    date: string
    high: number
    low: number
    condition: string
    icon: string
  }>
}

interface WeatherWidgetProps {
  className?: string
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase()
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return <Sun className="h-6 w-6 text-yellow-500" />
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className="h-6 w-6 text-blue-500" />
  }
  if (lowerCondition.includes('snow')) {
    return <CloudSnow className="h-6 w-6 text-gray-400" />
  }
  return <Cloud className="h-6 w-6 text-gray-500" />
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [weather, setWeather] = React.useState<WeatherData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Default to ZIP code 19335 (Downingtown, PA area)
        await fetchWeatherByZip('19335')
      } catch (err) {
        setError('Failed to load weather data')
        setLoading(false)
      }
    }

    const fetchWeatherByZip = async (zipCode: string) => {
      try {
        const response = await fetch(`/api/weather?zip=${zipCode}`)
        if (!response.ok) {
          throw new Error('Weather API error')
        }
        const data = await response.json()
        setWeather(data)
      } catch (err) {
        setError('Unable to fetch weather')
      } finally {
        setLoading(false)
      }
    }

    const fetchWeatherData = async (lat: number, lon: number) => {
      try {
        const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
        if (!response.ok) {
          throw new Error('Weather API error')
        }
        const data = await response.json()
        setWeather(data)
      } catch (err) {
        setError('Unable to fetch weather')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-8 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-12 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-muted-foreground">{error || 'Weather unavailable'}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Weather */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Current Weather</h3>
        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.current.condition)}
              <span className="text-2xl font-bold">{Math.round(weather.current.temp)}°F</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{weather.current.condition}</p>
          
          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-500" />
              <span>{weather.current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-gray-500" />
              <span>{Math.round(weather.current.windSpeed)} mph</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">3-Day Forecast</h3>
        <div className="space-y-1">
          {weather.forecast.map((day, index) => (
            <div key={index} className="bg-muted/30 rounded-md p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-1">
                {getWeatherIcon(day.condition)}
                <span className="font-medium">
                  {index === 0 ? 'Today' : 
                   index === 1 ? 'Tomorrow' : 
                   new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-right">
                <span className="font-medium">{Math.round(day.high)}°</span>
                <span className="text-muted-foreground">{Math.round(day.low)}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}