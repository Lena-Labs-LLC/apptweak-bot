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
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (!apps || !metrics) {
    return NextResponse.json({ error: 'Apps and metrics parameters are required' }, { status: 400 })
  }

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required for historical data' }, { status: 400 })
  }

  try {
    const url = `https://public-api.apptweak.com/api/public/store/apps/metrics/history.json?apps=${apps}&metrics=${metrics}&country=${country}&device=${device}&start_date=${startDate}&end_date=${endDate}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-apptweak-key': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('AppTweak API error:', errorData)
      
      if (errorData.error?.code === 'NotEnoughCreditsError') {
        return NextResponse.json(
          { error: 'Insufficient credits for historical data. Please check your AppTweak account balance.' }, 
          { status: 402 }
        )
      }
      
      throw new Error(`AppTweak API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching historical data from AppTweak API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data from AppTweak API' }, 
      { status: 500 }
    )
  }
}