import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = request.headers.get('x-apptweak-key')
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 })
  }

  const store = searchParams.get('store') || 'ios'
  const countries = searchParams.get('countries') || 'all'

  try {
    const url = `https://public-api.apptweak.com/api/public/apptweak/languages?store=${store}&countries=${countries}`
    
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
    console.error('Error fetching languages from AppTweak API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch languages from AppTweak API' }, 
      { status: 500 }
    )
  }
} 