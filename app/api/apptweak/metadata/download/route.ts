import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-apptweak-key')
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { apps, country = 'us', device = 'iphone', language = 'en', format = 'json' } = body

    if (!apps || !Array.isArray(apps) || apps.length === 0) {
      return NextResponse.json({ error: 'Apps array is required' }, { status: 400 })
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

    const metadataResults: any = {}
    const errors: any = {}

    // Fetch metadata for each app
    for (const appId of apps) {
      try {
        // Only include language parameter if it's different from the default to avoid validation errors
        const params = new URLSearchParams({
          apps: appId,
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
          errors[appId] = errorData.error || `HTTP ${response.status}`
          continue
        }

        const data = await response.json()
        metadataResults[appId] = data.result?.[appId] || data
      } catch (error) {
        errors[appId] = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Prepare download data
    const downloadData = {
      metadata: metadataResults,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      export_info: {
        exported_at: new Date().toISOString(),
        country,
        device,
        language,
        total_apps: apps.length,
        successful_apps: Object.keys(metadataResults).length,
        failed_apps: Object.keys(errors).length
      }
    }

    // Create filename based on timestamp and parameters
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `apptweak_metadata_${country}_${device}_${timestamp}.json`

    // Return as downloadable file
    return new NextResponse(JSON.stringify(downloadData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error in metadata download:', error)
    return NextResponse.json(
      { error: 'Failed to process metadata download' }, 
      { status: 500 }
    )
  }
}