import { NextRequest, NextResponse } from 'next/server'

interface OpenWeatherResponse {
  current: {
    temp: number
    humidity: number
    wind_speed: number
    visibility: number
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }
  daily: Array<{
    dt: number
    temp: {
      max: number
      min: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }>
}

// Using OpenWeatherMap One Call API 2.5 (free tier)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/onecall'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const zip = searchParams.get('zip')

    if (!lat && !lon && !zip) {
      return NextResponse.json(
        { error: 'Latitude and longitude or ZIP code are required' },
        { status: 400 }
      )
    }

    // If no API key is configured, return mock data
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'demo') {
      // Return realistic mock data for Downingtown, PA area (19335)
      const mockWeatherData = {
        current: {
          temp: 72,
          condition: 'Clear Sky',
          humidity: 58,
          windSpeed: 6,
          visibility: 10,
          icon: '01d'
        },
        forecast: [
          {
            date: new Date().toISOString(),
            high: 75,
            low: 58,
            condition: 'Clear Sky',
            icon: '01d'
          },
          {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            high: 78,
            low: 61,
            condition: 'Partly Cloudy',
            icon: '02d'
          },
          {
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            high: 71,
            low: 55,
            condition: 'Few Clouds',
            icon: '02d'
          }
        ]
      }

      return NextResponse.json(mockWeatherData)
    }

    let weatherUrl: string
    
    if (zip) {
      // First, get coordinates from ZIP code using Geocoding API
      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${WEATHER_API_KEY}`
      
      console.log('Making geocoding request to:', geocodeUrl.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN'))
      
      const geocodeResponse = await fetch(geocodeUrl)
      if (!geocodeResponse.ok) {
        console.error(`Geocoding API error: ${geocodeResponse.status}`, await geocodeResponse.text())
        throw new Error(`Geocoding API error: ${geocodeResponse.status}`)
      }
      
      const geocodeData = await geocodeResponse.json()
      console.log('Geocoding response:', geocodeData)
      weatherUrl = `${WEATHER_API_URL}?lat=${geocodeData.lat}&lon=${geocodeData.lon}&appid=${WEATHER_API_KEY}&units=imperial&exclude=minutely,hourly,alerts`
    } else {
      weatherUrl = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial&exclude=minutely,hourly,alerts`
    }

    console.log('Making weather request to:', weatherUrl.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN'))

    const response = await fetch(weatherUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Weather API error: ${response.status}`, errorText)
      throw new Error(`Weather API error: ${response.status} - ${errorText}`)
    }

    const data: OpenWeatherResponse = await response.json()

    const transformedData = {
      current: {
        temp: data.current.temp,
        condition: data.current.weather[0]?.description || 'Unknown',
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        visibility: data.current.visibility / 1609.34, // Convert meters to miles
        icon: data.current.weather[0]?.icon || '01d'
      },
      forecast: data.daily.slice(0, 3).map(day => ({
        date: new Date(day.dt * 1000).toISOString(),
        high: day.temp.max,
        low: day.temp.min,
        condition: day.weather[0]?.description || 'Unknown',
        icon: day.weather[0]?.icon || '01d'
      }))
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Weather API error:', error)
    
    // Return fallback data in case of API errors
    const fallbackData = {
      current: {
        temp: 72,
        condition: 'Weather Unavailable',
        humidity: 50,
        windSpeed: 5,
        visibility: 10,
        icon: '01d'
      },
      forecast: [
        {
          date: new Date().toISOString(),
          high: 75,
          low: 60,
          condition: 'Partly Cloudy',
          icon: '02d'
        },
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          high: 77,
          low: 62,
          condition: 'Sunny',
          icon: '01d'
        },
        {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          high: 70,
          low: 58,
          condition: 'Cloudy',
          icon: '03d'
        }
      ]
    }

    return NextResponse.json(fallbackData)
  }
}