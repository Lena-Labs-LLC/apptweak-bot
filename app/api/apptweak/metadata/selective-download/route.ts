import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-apptweak-key')
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { apps, country = 'us', device = 'iphone', language = 'en', selectedElements, allInOne = false, existingMetadata } = body

    if (!apps || !Array.isArray(apps) || apps.length === 0) {
      return NextResponse.json({ error: 'Apps array is required' }, { status: 400 })
    }

    if (!selectedElements || !Array.isArray(selectedElements) || selectedElements.length === 0) {
      return NextResponse.json({ error: 'Selected elements array is required' }, { status: 400 })
    }

    // Map common country-language combinations to avoid validation errors
    const getValidLanguageForCountry = (country: string, language: string) => {
      const countryLanguageMap: { [key: string]: string } = {
        'us': 'en', 'gb': 'en', 'ca': 'en', 'au': 'en',
        'de': 'de', 'fr': 'fr', 'es': 'es', 'it': 'it',
        'pt': 'pt', 'br': 'pt', 'ru': 'ru', 'jp': 'ja',
        'kr': 'ko', 'cn': 'zh'
      }
      return countryLanguageMap[country] || language
    }

    const validLanguage = getValidLanguageForCountry(country, language)

    // Create a ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Uint8Array[] = []

    // Convert archive to buffer
    archive.on('data', (chunk) => chunks.push(chunk))
    
    let archiveFinalized = false
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        if (!archiveFinalized) {
          archiveFinalized = true
          resolve(Buffer.concat(chunks))
        }
      })
      archive.on('error', reject)
    })

    // Process each app and collect all async operations
    const appProcessingPromises = apps.map(async (appId) => {
      try {
        let appData = null

        // Use existing metadata if provided, otherwise fetch from API
        if (existingMetadata && existingMetadata[appId]) {
          console.log(`Using existing metadata for ${appId}`)
          // Handle both direct metadata and nested metadata structure
          appData = existingMetadata[appId].metadata || existingMetadata[appId]
        } else {
          console.log(`Fetching fresh metadata for ${appId}`)
          // Only include language parameter if it's different from the default
          const params = new URLSearchParams({
            apps: appId,
            country,
            device
          })
          
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
            console.error(`Failed to fetch metadata for ${appId}:`, response.status, errorData)
            
            // Add error info to archive
            const errorInfo = {
              app_id: appId,
              error: errorData.error || `HTTP ${response.status}`,
              timestamp: new Date().toISOString(),
              message: 'Could not fetch metadata - check API credits and app ID'
            }
            
            const errorFolderName = `${appId}_ERROR`
            archive.append(JSON.stringify(errorInfo, null, 2), { 
              name: `${errorFolderName}/error_details.json` 
            })
            
            return
          }

          const data = await response.json()
          console.log(`Raw API response for ${appId}:`, JSON.stringify(data, null, 2))
          
          appData = data.result?.[appId]

          if (!appData) {
            console.error(`No data found for app ${appId}`)
            console.log('Available result keys:', Object.keys(data.result || {}))
            
            // Add info about missing data
            const noDataInfo = {
              app_id: appId,
              issue: 'No app data in API response',
              available_keys: Object.keys(data.result || {}),
              full_response: data
            }
            
            const noDataFolderName = `${appId}_NO_DATA`
            archive.append(JSON.stringify(noDataInfo, null, 2), { 
              name: `${noDataFolderName}/no_data_details.json` 
            })
            
            return
          }
        }

        if (!appData) {
          console.error(`No app data available for ${appId}`)
          return
        }

        // Create app folder name (used for both folder structure and file naming)
        const appFolderName = `${appData.title || appId}`.replace(/[^a-zA-Z0-9\-_]/g, '_')

        // Process selected elements and wait for all downloads
        const elementPromises = selectedElements.map(async (element) => {
          try {
            switch (element) {
              case 'title':
                if (appData.title) {
                  const fileName = allInOne 
                    ? `title/${appFolderName}.txt`
                    : `${appFolderName}/title/title.txt`
                  archive.append(appData.title, { name: fileName })
                }
                break

              case 'subtitle':
                if (appData.subtitle) {
                  const fileName = allInOne 
                    ? `subtitle/${appFolderName}.txt`
                    : `${appFolderName}/subtitle/subtitle.txt`
                  archive.append(appData.subtitle, { name: fileName })
                }
                break

              case 'description':
                if (appData.description || appData.long_description) {
                  const description = appData.description || appData.long_description
                  const fileName = allInOne 
                    ? `description/${appFolderName}.txt`
                    : `${appFolderName}/description/description.txt`
                  archive.append(description, { name: fileName })
                }
                break

              case 'icon':
                if (appData.icon) {
                  try {
                    const iconResponse = await fetch(appData.icon)
                    if (iconResponse.ok) {
                      const iconBuffer = await iconResponse.arrayBuffer()
                      const iconExtension = appData.icon.includes('.png') ? 'png' : 'jpg'
                      const fileName = allInOne 
                        ? `icon/${appFolderName}.${iconExtension}`
                        : `${appFolderName}/icon/icon.${iconExtension}`
                      archive.append(Buffer.from(iconBuffer), { name: fileName })
                    }
                  } catch (iconError) {
                    console.error(`Failed to download icon for ${appId}:`, iconError)
                  }
                }
                break

              case 'screenshots':
                console.log(`Processing screenshots for ${appId}`)
                console.log('Screenshots data:', JSON.stringify(appData.screenshots, null, 2))
                
                if (appData.screenshots) {
                  let downloadedCount = 0
                  const screenshotPromises: Promise<boolean>[] = []
                  
                  // Handle different screenshot formats
                  if (Array.isArray(appData.screenshots)) {
                    console.log(`Found ${appData.screenshots.length} screenshots (simple array format)`)
                    // Simple array format - array of URLs or objects
                    appData.screenshots.forEach((screenshot: any, index: number) => {
                      const screenshotIndex = index + 1
                      const screenshotUrl = typeof screenshot === 'string' ? screenshot : screenshot.url
                      
                      if (screenshotUrl) {
                        const promise = (async () => {
                          try {
                            console.log(`Downloading screenshot ${screenshotIndex}: ${screenshotUrl}`)
                            const screenshotResponse = await fetch(screenshotUrl)
                            console.log(`Screenshot ${screenshotIndex} response status:`, screenshotResponse.status)
                            
                            if (screenshotResponse.ok) {
                              const screenshotBuffer = await screenshotResponse.arrayBuffer()
                              const extension = screenshotUrl.includes('.png') ? 'png' : 'jpg'
                              const fileName = allInOne 
                                ? `screenshots/${appFolderName}_${screenshotIndex}.${extension}`
                                : `${appFolderName}/screenshots/screenshot_${screenshotIndex}.${extension}`
                              
                              archive.append(Buffer.from(screenshotBuffer), { name: fileName })
                              console.log(`Successfully added screenshot: ${fileName} (${screenshotBuffer.byteLength} bytes)`)
                              return true
                            } else {
                              console.error(`Failed to download screenshot ${screenshotIndex}: HTTP ${screenshotResponse.status}`)
                              return false
                            }
                          } catch (screenshotError) {
                            console.error(`Failed to download screenshot ${screenshotIndex} for ${appId}:`, screenshotError)
                            return false
                          }
                        })()
                        screenshotPromises.push(promise)
                      }
                    })
                  } else if (typeof appData.screenshots === 'object') {
                    console.log('Screenshots object keys:', Object.keys(appData.screenshots))
                    // Object format - device keys with arrays of screenshot objects
                    let screenshotIndex = 1
                    for (const [deviceType, screenshots] of Object.entries(appData.screenshots)) {
                      if (Array.isArray(screenshots)) {
                        console.log(`Found ${screenshots.length} screenshots for ${deviceType}`)
                        for (const screenshot of screenshots) {
                          const currentIndex = screenshotIndex++
                          // Handle both string URLs and object format with url property
                          const screenshotUrl = typeof screenshot === 'string' ? screenshot : screenshot.url
                          
                          if (screenshotUrl) {
                            const promise = (async () => {
                              try {
                                console.log(`Downloading ${deviceType} screenshot ${currentIndex}: ${screenshotUrl}`)
                                const screenshotResponse = await fetch(screenshotUrl)
                                console.log(`${deviceType} screenshot ${currentIndex} response status:`, screenshotResponse.status)
                                
                                if (screenshotResponse.ok) {
                                  const screenshotBuffer = await screenshotResponse.arrayBuffer()
                                  const extension = screenshotUrl.includes('.png') ? 'png' : 'jpg'
                                  const fileName = allInOne 
                                    ? `screenshots/${appFolderName}_${currentIndex}.${extension}`
                                    : `${appFolderName}/screenshots/${deviceType}_screenshot_${currentIndex}.${extension}`
                                  
                                  archive.append(Buffer.from(screenshotBuffer), { name: fileName })
                                  console.log(`Successfully added screenshot: ${fileName} (${screenshotBuffer.byteLength} bytes)`)
                                  return true
                                } else {
                                  console.error(`Failed to download ${deviceType} screenshot ${currentIndex}: HTTP ${screenshotResponse.status}`)
                                  return false
                                }
                              } catch (screenshotError) {
                                console.error(`Failed to download ${deviceType} screenshot ${currentIndex} for ${appId}:`, screenshotError)
                                return false
                              }
                            })()
                            screenshotPromises.push(promise)
                          } else {
                            console.warn(`No URL found for ${deviceType} screenshot ${currentIndex}:`, screenshot)
                          }
                        }
                      }
                    }
                  }
                  
                  // Wait for all screenshot downloads to complete
                  const results = await Promise.all(screenshotPromises)
                  downloadedCount = results.filter(Boolean).length
                  
                  console.log(`Total screenshots downloaded for ${appId}: ${downloadedCount}`)
                  
                  // Add a note about downloaded screenshots to the summary
                  if (downloadedCount === 0) {
                    const fileName = allInOne 
                      ? `screenshots/${appFolderName}_download_issues.txt`
                      : `${appFolderName}/screenshots/download_issues.txt`
                    archive.append('No screenshots were successfully downloaded. Check the console logs for details.', { 
                      name: fileName 
                    })
                  }
                } else {
                  console.log(`No screenshots data found for ${appId}`)
                  const fileName = allInOne 
                    ? `screenshots/${appFolderName}_no_screenshots.txt`
                    : `${appFolderName}/screenshots/no_screenshots.txt`
                  archive.append('No screenshots data available in the metadata.', { 
                    name: fileName 
                  })
                }
                break

              default:
                console.warn(`Unknown element type: ${element}`)
            }
          } catch (elementError) {
            console.error(`Error processing ${element} for ${appId}:`, elementError)
          }
        })

        // Wait for all element processing to complete
        await Promise.all(elementPromises)

        // Add metadata summary for this app
        const summary = {
          app_id: appId,
          title: appData.title,
          processed_elements: selectedElements,
          export_date: new Date().toISOString(),
          metadata_available: {
            has_screenshots: !!appData.screenshots,
            screenshots_type: Array.isArray(appData.screenshots) ? 'array' : typeof appData.screenshots,
            screenshots_count: Array.isArray(appData.screenshots) ? appData.screenshots.length : 
                              (typeof appData.screenshots === 'object' && appData.screenshots) ? 
                              Object.values(appData.screenshots).flat().length : 0,
            has_icon: !!appData.icon,
            has_title: !!appData.title,
            has_subtitle: !!appData.subtitle,
            has_description: !!(appData.description || appData.long_description)
          }
        }
        const summaryFileName = allInOne 
          ? `metadata_summary/${appFolderName}.json`
          : `${appFolderName}/metadata_summary.json`
        archive.append(JSON.stringify(summary, null, 2), { name: summaryFileName })

      } catch (appError) {
        console.error(`Error processing app ${appId}:`, appError)
      }
    })

    // Wait for all app processing to complete
    await Promise.all(appProcessingPromises)

    // Finalize the archive
    archive.finalize()

    // Wait for archive to complete
    const zipBuffer = await archivePromise

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `apptweak_selective_${selectedElements.join('_')}_${timestamp}.zip`

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error in selective metadata download:', error)
    return NextResponse.json(
      { error: 'Failed to process selective metadata download' }, 
      { status: 500 }
    )
  }
}