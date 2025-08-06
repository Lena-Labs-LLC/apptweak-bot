import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = request.headers.get('x-apptweak-key')
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 })
  }

  // Get query parameters
  const apps = searchParams.get('apps')
  const metrics = searchParams.get('metrics')
  const country = searchParams.get('country') || 'us'
  const device = searchParams.get('device') || 'iphone'

  if (!apps || !metrics) {
    return NextResponse.json({ error: 'Apps and metrics parameters are required' }, { status: 400 })
  }

  try {
    const url = `https://public-api.apptweak.com/api/public/store/apps/metrics/current.json?apps=${apps}&metrics=${metrics}&country=${country}&device=${device}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-apptweak-key': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`AppTweak API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching from AppTweak API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from AppTweak API' }, 
      { status: 500 }
    )
  }
} 