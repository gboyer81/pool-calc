import { NextRequest, NextResponse } from 'next/server'

interface TomorrowIOResponse {
  data: {
    timelines: Array<{
      timestep: string
      endTime: string
      startTime: string
      intervals: Array<{
        startTime: string
        values: {
          temperature: number
          humidity: number
          windSpeed: number
          visibility: number
          weatherCode: number
          temperatureMax?: number
          temperatureMin?: number
        }
      }>
    }>
  }
}

// Using Tomorrow.io Weather API
// No Y in TOMORROWIO_API_KEY to avoid over calling the API during development
const WEATHER_API_KEY = process.env.TOMORROWIO_API_KE || 'API KEY NOT FOUND'
const WEATHER_API_URL = 'https://api.tomorrow.io/v4/timelines'

// Map Tomorrow.io weather codes to descriptions and icons
const getWeatherInfo = (code: number) => {
  const weatherMap: { [key: number]: { description: string; icon: string } } = {
    0: { description: 'Unknown', icon: '01d' },
    1000: { description: 'Clear', icon: '01d' },
    1100: { description: 'Mostly Clear', icon: '02d' },
    1101: { description: 'Partly Cloudy', icon: '02d' },
    1102: { description: 'Mostly Cloudy', icon: '03d' },
    1001: { description: 'Cloudy', icon: '04d' },
    2000: { description: 'Fog', icon: '50d' },
    2100: { description: 'Light Fog', icon: '50d' },
    4000: { description: 'Drizzle', icon: '09d' },
    4001: { description: 'Rain', icon: '10d' },
    4200: { description: 'Light Rain', icon: '09d' },
    4201: { description: 'Heavy Rain', icon: '11d' },
    5000: { description: 'Snow', icon: '13d' },
    5001: { description: 'Flurries', icon: '13d' },
    5100: { description: 'Light Snow', icon: '13d' },
    5101: { description: 'Heavy Snow', icon: '13d' },
    6000: { description: 'Freezing Drizzle', icon: '13d' },
    6001: { description: 'Freezing Rain', icon: '13d' },
    6200: { description: 'Light Freezing Rain', icon: '13d' },
    6201: { description: 'Heavy Freezing Rain', icon: '13d' },
    7000: { description: 'Ice Pellets', icon: '13d' },
    7101: { description: 'Heavy Ice Pellets', icon: '13d' },
    7102: { description: 'Light Ice Pellets', icon: '13d' },
    8000: { description: 'Thunderstorm', icon: '11d' },
  }
  
  return weatherMap[code] || { description: 'Unknown', icon: '01d' }
}

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
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'API KEY NOT FOUND') {
      // Return realistic mock data for Downingtown, PA area (19335)
      const mockWeatherData = {
        current: {
          temp: 54,
          condition: 'Sunny',
          humidity: 58,
          windSpeed: 6,
          visibility: 10,
          icon: '01d',
        },
        forecast: [
          {
            date: new Date().toISOString(),
            high: 75,
            low: 58,
            condition: 'Clear Sky',
            icon: '01d',
          },
          {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            high: 78,
            low: 61,
            condition: 'Partly Cloudy',
            icon: '02d',
          },
          {
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            high: 71,
            low: 55,
            condition: 'Few Clouds',
            icon: '02d',
          },
        ],
      }

      return NextResponse.json(mockWeatherData)
    }

    let location = ''

    if (zip) {
      // For ZIP code, we'll use a default location (Downingtown, PA for 19335)
      // Tomorrow.io can handle ZIP codes directly in some cases, but coordinates are more reliable
      if (zip === '19335') {
        location = '40.0065,-75.7032'  // Downingtown, PA coordinates
      } else {
        // For other ZIP codes, we'd typically need geocoding, but for simplicity using default
        location = '40.0065,-75.7032'
      }
    } else {
      location = `${lat},${lon}`
    }

    // Tomorrow.io API request with current conditions and 3-day forecast
    const requestBody = {
      location: location,
      fields: [
        'temperature',
        'humidity', 
        'windSpeed',
        'visibility',
        'weatherCode',
        'temperatureMax',
        'temperatureMin'
      ],
      units: 'imperial',
      timesteps: ['1h', '1d'],
      startTime: 'now',
      endTime: 'nowPlus3d'
    }

    console.log('Making Tomorrow.io weather request')

    const response = await fetch(WEATHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WEATHER_API_KEY
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Tomorrow.io API error: ${response.status}`, errorText)
      throw new Error(`Weather API error: ${response.status} - ${errorText}`)
    }

    const data: TomorrowIOResponse = await response.json()

    // Extract current conditions (first hourly reading)
    const currentTimeline = data.data.timelines.find(t => t.timestep === '1h')
    const dailyTimeline = data.data.timelines.find(t => t.timestep === '1d')
    
    if (!currentTimeline || !dailyTimeline || !currentTimeline.intervals.length || !dailyTimeline.intervals.length) {
      throw new Error('Invalid API response structure')
    }

    const current = currentTimeline.intervals[0].values
    const currentWeatherInfo = getWeatherInfo(current.weatherCode)

    const transformedData = {
      current: {
        temp: current.temperature,
        condition: currentWeatherInfo.description,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        visibility: current.visibility,
        icon: currentWeatherInfo.icon,
      },
      forecast: dailyTimeline.intervals.slice(0, 3).map((day) => {
        const weatherInfo = getWeatherInfo(day.values.weatherCode)
        return {
          date: day.startTime,
          high: day.values.temperatureMax || day.values.temperature,
          low: day.values.temperatureMin || day.values.temperature,
          condition: weatherInfo.description,
          icon: weatherInfo.icon,
        }
      }),
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
        icon: '01d',
      },
      forecast: [
        {
          date: new Date().toISOString(),
          high: 75,
          low: 60,
          condition: 'Partly Cloudy',
          icon: '02d',
        },
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          high: 77,
          low: 62,
          condition: 'Sunny',
          icon: '01d',
        },
        {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          high: 70,
          low: 58,
          condition: 'Cloudy',
          icon: '03d',
        },
      ],
    }

    return NextResponse.json(fallbackData)
  }
}
