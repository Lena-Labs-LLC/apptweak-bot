import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = request.headers.get('x-apptweak-key')
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 })
  }

  // Get query parameters
  const apps = searchParams.get('apps')
  const country = searchParams.get('country') || 'us'
  const device = searchParams.get('device') || 'iphone'
  const language = searchParams.get('language') || 'en'

  if (!apps) {
    return NextResponse.json({ error: 'Apps parameter is required' }, { status: 400 })
  }

  // Map common country-language combinations to avoid validation errors
  const getValidLanguageForCountry = (country: string, language: string) => {
    const countryLanguageMap: { [key: string]: string } = {
      'us': 'en',
      'gb': 'en', 
      'ca': 'en',
      'au': 'en',
      'de': 'de',
      'fr': 'fr',
      'es': 'es',
      'it': 'it',
      'pt': 'pt',
      'br': 'pt',
      'ru': 'ru',
      'jp': 'ja',
      'kr': 'ko',
      'cn': 'zh'
    }
    
    // Return mapped language for country, or original language if no mapping exists
    return countryLanguageMap[country] || language
  }

  const validLanguage = getValidLanguageForCountry(country, language)

  try {
    // Only include language parameter if it's different from the default to avoid validation errors
    const params = new URLSearchParams({
      apps,
      country,
      device
    })
    
    // Only add language if it's specifically requested and mapped
    if (language !== 'en' || country !== 'us') {
      params.append('language', validLanguage)
    }
    
    const url = `https://public-api.apptweak.com/api/public/store/apps/metadata.json?${params.toString()}`
    
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
          { error: 'Insufficient credits for metadata. Please check your AppTweak account balance.' }, 
          { status: 402 }
        )
      }
      
      throw new Error(`AppTweak API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching metadata from AppTweak API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metadata from AppTweak API' }, 
      { status: 500 }
    )
  }
}