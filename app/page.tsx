"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { AlertCircle, Key, BarChart3, Plus, Trash2, Calendar, TrendingUp, Download, FileText, Folder } from 'lucide-react'

interface Country {
  code: string
  name: string
  flag?: string
}

interface AppMetricsData {
  appIds: string[]
  metrics: string[]
  country: string
  device: string
  startDate?: Date
  endDate?: Date
  isHistorical: boolean
}

interface AppMetadataData {
  appIds: string[]
  country: string
  device: string
  language: string
  selectedElements: string[]
  allInOne: boolean
}

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [appMetrics, setAppMetrics] = useState<AppMetricsData>({
    appIds: [''],
    metrics: [],
    country: 'us',
    device: 'iphone',
    isHistorical: false
  })
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [appMetadata, setAppMetadata] = useState<AppMetadataData>({
    appIds: [''],
    country: 'us',
    device: 'iphone',
    language: 'en',
    selectedElements: [],
    allInOne: false
  })
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataResults, setMetadataResults] = useState<any>(null)

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('apptweak-api-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Load countries from AppTweak API
  const loadCountries = async () => {
    if (!apiKey) return

    try {
      const store = appMetrics.device === 'android' ? 'android' : 'ios'
      const response = await fetch(`/api/apptweak/countries?store=${store}`, {
        headers: {
          'x-apptweak-key': apiKey
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          setCountries(data.result)
        }
      }
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  // Load countries when API key changes
  useEffect(() => {
    if (apiKey) {
      loadCountries()
    }
  }, [apiKey, appMetrics.device])

  // Auto-update language when country changes for metadata
  const handleMetadataCountryChange = (country: string) => {
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

    const suggestedLanguage = countryLanguageMap[country] || 'en'
    
    setAppMetadata({
      ...appMetadata, 
      country: country,
      language: suggestedLanguage
    })
  }

  // Save API key to localStorage
  const saveApiKey = () => {
    localStorage.setItem('apptweak-api-key', apiKey)
    // Show success message briefly
    const button = document.querySelector('[data-save-button]') as HTMLButtonElement
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Saved!'
      setTimeout(() => {
        button.textContent = originalText
      }, 2000)
    }
  }

  // Add new app ID input
  const addAppId = () => {
    if (appMetrics.appIds.length < 5) {
      setAppMetrics({
        ...appMetrics,
        appIds: [...appMetrics.appIds, '']
      })
    }
  }

  // Remove app ID input
  const removeAppId = (index: number) => {
    const newAppIds = appMetrics.appIds.filter((_, i) => i !== index)
    setAppMetrics({
      ...appMetrics,
      appIds: newAppIds.length > 0 ? newAppIds : ['']
    })
  }

  // Update app ID
  const updateAppId = (index: number, value: string) => {
    const newAppIds = [...appMetrics.appIds]
    newAppIds[index] = value
    setAppMetrics({
      ...appMetrics,
      appIds: newAppIds
    })
  }

  // Toggle metric
  const toggleMetric = (metric: string) => {
    const newMetrics = appMetrics.metrics.includes(metric)
      ? appMetrics.metrics.filter(m => m !== metric)
      : [...appMetrics.metrics, metric]
    
    setAppMetrics({
      ...appMetrics,
      metrics: newMetrics
    })
  }

  // Fetch app metrics
  const fetchAppMetrics = async () => {
    if (!apiKey) {
      alert('Please enter your AppTweak API key')
      return
    }

    const validAppIds = appMetrics.appIds.filter(id => id.trim() !== '')
    if (validAppIds.length === 0) {
      alert('Please enter at least one app ID')
      return
    }

    if (appMetrics.metrics.length === 0) {
      alert('Please select at least one metric')
      return
    }

    // Check if historical data is requested
    if (appMetrics.isHistorical) {
      if (!appMetrics.startDate || !appMetrics.endDate) {
        alert('Please select both start and end dates for historical data')
        return
      }
    }

    setIsLoading(true)
    
    try {
      let url: string
      
      if (appMetrics.isHistorical && appMetrics.startDate && appMetrics.endDate) {
        // Format dates as YYYY-MM-DD
        const startDate = appMetrics.startDate.toISOString().split('T')[0]
        const endDate = appMetrics.endDate.toISOString().split('T')[0]
        
        url = `/api/apptweak/metrics/history?apps=${validAppIds.join(',')}&metrics=${appMetrics.metrics.join(',')}&country=${appMetrics.country}&device=${appMetrics.device}&start_date=${startDate}&end_date=${endDate}`
      } else {
        // Current metrics
        url = `/api/apptweak/metrics?apps=${validAppIds.join(',')}&metrics=${appMetrics.metrics.join(',')}&country=${appMetrics.country}&device=${appMetrics.device}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-apptweak-key': apiKey
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error fetching app metrics:', error)
      alert(`Error fetching app metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Add new app ID for metadata
  const addMetadataAppId = () => {
    if (appMetadata.appIds.length < 10) {
      setAppMetadata({
        ...appMetadata,
        appIds: [...appMetadata.appIds, '']
      })
    }
  }

  // Remove app ID for metadata
  const removeMetadataAppId = (index: number) => {
    const newAppIds = appMetadata.appIds.filter((_, i) => i !== index)
    setAppMetadata({
      ...appMetadata,
      appIds: newAppIds.length > 0 ? newAppIds : ['']
    })
  }

  // Update metadata app ID
  const updateMetadataAppId = (index: number, value: string) => {
    const newAppIds = [...appMetadata.appIds]
    newAppIds[index] = value
    setAppMetadata({
      ...appMetadata,
      appIds: newAppIds
    })
  }

  // Toggle metadata element selection
  const toggleMetadataElement = (element: string) => {
    const newElements = appMetadata.selectedElements.includes(element)
      ? appMetadata.selectedElements.filter(e => e !== element)
      : [...appMetadata.selectedElements, element]
    
    setAppMetadata({
      ...appMetadata,
      selectedElements: newElements
    })
  }

  // Fetch app metadata
  const fetchAppMetadata = async () => {
    if (!apiKey) {
      alert('Please enter your AppTweak API key')
      return
    }

    const validAppIds = appMetadata.appIds.filter(id => id.trim() !== '')
    if (validAppIds.length === 0) {
      alert('Please enter at least one app ID')
      return
    }

    setIsLoadingMetadata(true)
    
    try {
      const url = `/api/apptweak/metadata?apps=${validAppIds.join(',')}&country=${appMetadata.country}&device=${appMetadata.device}&language=${appMetadata.language}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-apptweak-key': apiKey
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setMetadataResults(data)
    } catch (error) {
      console.error('Error fetching app metadata:', error)
      alert(`Error fetching app metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  // Download metadata as JSON file (full metadata)
  const downloadMetadata = async () => {
    if (!apiKey) {
      alert('Please enter your AppTweak API key')
      return
    }

    const validAppIds = appMetadata.appIds.filter(id => id.trim() !== '')
    if (validAppIds.length === 0) {
      alert('Please enter at least one app ID')
      return
    }

    setIsLoadingMetadata(true)
    
    try {
      const response = await fetch('/api/apptweak/metadata/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apptweak-key': apiKey
        },
        body: JSON.stringify({
          apps: validAppIds,
          country: appMetadata.country,
          device: appMetadata.device,
          language: appMetadata.language
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                      `apptweak_metadata_${appMetadata.country}_${appMetadata.device}_${new Date().toISOString().split('T')[0]}.json`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`Metadata downloaded successfully as ${filename}`)
    } catch (error) {
      console.error('Error downloading metadata:', error)
      alert(`Error downloading metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  // Download selective metadata elements as organized files
  const downloadSelectiveMetadata = async () => {
    if (!apiKey) {
      alert('Please enter your AppTweak API key')
      return
    }

    const validAppIds = appMetadata.appIds.filter(id => id.trim() !== '')
    if (validAppIds.length === 0) {
      alert('Please enter at least one app ID')
      return
    }

    if (appMetadata.selectedElements.length === 0) {
      alert('Please select at least one metadata element to download')
      return
    }

    // Check if we have existing metadata results to use
    if (!metadataResults || !metadataResults.result) {
      alert('Please fetch metadata first by clicking "Preview Metadata" before downloading selective elements.')
      return
    }

    setIsLoadingMetadata(true)
    
    try {
      const response = await fetch('/api/apptweak/metadata/selective-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apptweak-key': apiKey
        },
        body: JSON.stringify({
          apps: validAppIds,
          country: appMetadata.country,
          device: appMetadata.device,
          language: appMetadata.language,
          selectedElements: appMetadata.selectedElements,
          allInOne: appMetadata.allInOne,
          existingMetadata: metadataResults.result // Pass the existing metadata
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `apptweak_selective_${appMetadata.selectedElements.join('_')}_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`Selective metadata downloaded successfully!`)
    } catch (error) {
      console.error('Error downloading selective metadata:', error)
      alert(`Error downloading selective metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  const availableMetrics = [
    { id: 'downloads', label: 'Downloads' },
    { id: 'revenues', label: 'Revenue' },
    { id: 'ratings', label: 'Rating' },
    { id: 'daily-ratings', label: 'Daily Rating' },
    { id: 'app-power', label: 'App Power' }
  ]

  const deviceOptions = [
    { value: 'iphone', label: 'iPhone' },
    { value: 'ipad', label: 'iPad' },
    { value: 'android', label: 'Android' }
  ]

  const countryOptions = [
    { value: 'us', label: '🇺🇸 United States' },
    { value: 'gb', label: '🇬🇧 United Kingdom' },
    { value: 'de', label: '🇩🇪 Germany' },
    { value: 'fr', label: '🇫🇷 France' },
    { value: 'jp', label: '🇯🇵 Japan' },
    { value: 'cn', label: '🇨🇳 China' },
    { value: 'kr', label: '🇰🇷 South Korea' },
    { value: 'ca', label: '🇨🇦 Canada' },
    { value: 'au', label: '🇦🇺 Australia' },
    { value: 'br', label: '🇧🇷 Brazil' }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
    { value: 'nl', label: 'Dutch' }
  ]

  const metadataElements = [
    { id: 'icon', label: 'App Icon', description: 'Download app icon image' },
    { id: 'screenshots', label: 'Screenshots', description: 'Download all app screenshots' },
    { id: 'title', label: 'Title', description: 'Save app title as text file' },
    { id: 'subtitle', label: 'Subtitle', description: 'Save app subtitle as text file' },
    { id: 'description', label: 'Description', description: 'Save app description as text file' }
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AppTweak Analytics</h1>
          <p className="text-muted-foreground">Modern analytics dashboard for app store data</p>
        </div>

        {/* API Key Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Enter your AppTweak API key to access the tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your AppTweak API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={saveApiKey} variant="outline" data-save-button>
                  Save
                </Button>
              </div>
            </div>
            {apiKey && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                API key configured
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tools Section */}
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              App Metrics
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              App Metadata
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>App Metrics</CardTitle>
                <CardDescription>
                  Get current metrics for your apps across different countries and devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* App IDs */}
                <div className="space-y-3">
                  <Label>App IDs (up to 5)</Label>
                  {appMetrics.appIds.map((appId, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`App ID ${index + 1}`}
                        value={appId}
                        onChange={(e) => updateAppId(index, e.target.value)}
                        className="flex-1"
                      />
                      {appMetrics.appIds.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeAppId(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {appMetrics.appIds.length < 5 && (
                    <Button variant="outline" onClick={addAppId} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add App ID
                    </Button>
                  )}
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <Label>Metrics</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableMetrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric.id}
                          checked={appMetrics.metrics.includes(metric.id)}
                          onCheckedChange={() => toggleMetric(metric.id)}
                        />
                        <Label htmlFor={metric.id} className="text-sm">
                          {metric.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Type Selection */}
                <div className="space-y-3">
                  <Label>Data Type</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="current-data"
                        checked={!appMetrics.isHistorical}
                        onCheckedChange={() => setAppMetrics({...appMetrics, isHistorical: false})}
                      />
                      <Label htmlFor="current-data" className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Current Data
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="historical-data"
                        checked={appMetrics.isHistorical}
                        onCheckedChange={() => setAppMetrics({...appMetrics, isHistorical: true})}
                      />
                      <Label htmlFor="historical-data" className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Historical Data
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Date Range Selection (only for historical data) */}
                {appMetrics.isHistorical && (
                  <div className="space-y-3">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Start Date</Label>
                        <DatePicker
                          date={appMetrics.startDate}
                          onDateChange={(date) => setAppMetrics({...appMetrics, startDate: date})}
                          placeholder="Select start date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">End Date</Label>
                        <DatePicker
                          date={appMetrics.endDate}
                          onDateChange={(date) => setAppMetrics({...appMetrics, endDate: date})}
                          placeholder="Select end date"
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <div className="font-medium mb-1">Historical Data Pricing</div>
                          <div className="space-y-1 text-xs">
                            <div>• Downloads/Revenues: 500 credits/app for 1st day + 50/day extra</div>
                            <div>• Ratings/Daily Ratings/App Power: 10 credits/app for 1st day + 1/day extra</div>
                            <div>• Shorter date ranges cost fewer credits</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Country and Device */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={appMetrics.country} onValueChange={(value) => 
                      setAppMetrics({...appMetrics, country: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {(countries.length > 0 ? countries.map(country => ({
                          value: country.code,
                          label: `${country.flag || ''} ${country.name}`.trim()
                        })) : countryOptions).map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Device</Label>
                    <Select value={appMetrics.device} onValueChange={(value) => 
                      setAppMetrics({...appMetrics, device: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceOptions.map((device) => (
                          <SelectItem key={device.value} value={device.value}>
                            {device.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fetch Button */}
                <Button onClick={fetchAppMetrics} disabled={isLoading} className="w-full">
                  {isLoading ? 'Fetching...' : 'Fetch App Metrics'}
                </Button>

                {/* Results */}
                {results && (
                  <div className="space-y-3">
                    <Label>Results</Label>
                    {results.result && Object.keys(results.result).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(results.result).map(([appId, appData]: [string, any]) => (
                          <Card key={appId}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                App ID: {appId}
                                {appMetrics.isHistorical && (
                                  <Badge variant="secondary" className="ml-2">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Historical
                                  </Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {appMetrics.isHistorical ? (
                                // Historical data visualization
                                <div className="space-y-4">
                                  {Object.entries(appData).map(([metric, dataPoints]: [string, any]) => (
                                    <div key={metric} className="space-y-3">
                                      <div className="font-medium capitalize text-lg">
                                        {metric.replace('-', ' ')}
                                      </div>
                                      <div className="grid gap-3">
                                        {Array.isArray(dataPoints) ? dataPoints.map((point: any, index: number) => (
                                          <div key={index} className="bg-muted p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                              <div className="text-sm text-muted-foreground">
                                                {point.date}
                                              </div>
                                              <div className="text-lg font-bold">
                                                {metric === 'revenues' ? `$${point.value?.toLocaleString()}` : 
                                                 metric === 'ratings' ? point.value?.toFixed(2) : 
                                                 point.value?.toLocaleString()}
                                              </div>
                                            </div>
                                            {point.currency && (
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {point.currency}
                                              </div>
                                            )}
                                            {point.breakdown && (
                                              <div className="mt-2 text-xs text-muted-foreground">
                                                <details>
                                                  <summary className="cursor-pointer">Rating Breakdown</summary>
                                                  <div className="mt-1 space-y-1">
                                                    <div>⭐ 5 stars: {point.breakdown[5]?.toLocaleString()}</div>
                                                    <div>⭐ 4 stars: {point.breakdown[4]?.toLocaleString()}</div>
                                                    <div>⭐ 3 stars: {point.breakdown[3]?.toLocaleString()}</div>
                                                    <div>⭐ 2 stars: {point.breakdown[2]?.toLocaleString()}</div>
                                                    <div>⭐ 1 star: {point.breakdown[1]?.toLocaleString()}</div>
                                                    <div className="pt-1 border-t">Total: {point.breakdown.total?.toLocaleString()}</div>
                                                  </div>
                                                </details>
                                              </div>
                                            )}
                                          </div>
                                        )) : (
                                          <div className="bg-muted p-3 rounded-lg">
                                            <div className="text-sm text-muted-foreground">No data available</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Current data visualization (existing)
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(appData).map(([metric, data]: [string, any]) => (
                                    <div key={metric} className="bg-muted p-3 rounded-lg">
                                      <div className="font-medium capitalize mb-1">
                                        {metric.replace('-', ' ')}
                                      </div>
                                      <div className="text-2xl font-bold">
                                        {metric === 'revenues' ? `$${data.value?.toLocaleString()}` : 
                                         metric === 'ratings' ? data.value?.toFixed(2) : 
                                         data.value?.toLocaleString()}
                                      </div>
                                      {data.date && (
                                        <div className="text-sm text-muted-foreground">
                                          {data.date}
                                        </div>
                                      )}
                                      {data.currency && (
                                        <div className="text-sm text-muted-foreground">
                                          {data.currency}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        <div className="bg-muted p-4 rounded-lg">
                          <details>
                            <summary className="cursor-pointer font-medium mb-2">
                              Raw JSON Response
                            </summary>
                            <pre className="text-sm overflow-auto">
                              {JSON.stringify(results, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>App Metadata</CardTitle>
                <CardDescription>
                  Fetch comprehensive app metadata including titles, descriptions, screenshots, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* App IDs */}
                <div className="space-y-3">
                  <Label>App IDs (up to 10)</Label>
                  {appMetadata.appIds.map((appId, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`App ID ${index + 1}`}
                        value={appId}
                        onChange={(e) => updateMetadataAppId(index, e.target.value)}
                        className="flex-1"
                      />
                      {appMetadata.appIds.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeMetadataAppId(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {appMetadata.appIds.length < 10 && (
                    <Button variant="outline" onClick={addMetadataAppId} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add App ID
                    </Button>
                  )}
                </div>

                {/* Metadata Elements Selection */}
                <div className="space-y-3">
                  <Label>Select Metadata Elements to Download</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metadataElements.map((element) => (
                      <div key={element.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={element.id}
                          checked={appMetadata.selectedElements.includes(element.id)}
                          onCheckedChange={() => toggleMetadataElement(element.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={element.id} className="text-sm font-medium">
                            {element.label}
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1">
                            {element.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {appMetadata.selectedElements.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Select at least one element to enable selective download
                    </div>
                  )}
                </div>

                {/* All in One Option */}
                {appMetadata.selectedElements.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/50">
                      <Checkbox
                        id="all-in-one"
                        checked={appMetadata.allInOne}
                        onCheckedChange={(checked) => setAppMetadata(prev => ({
                          ...prev,
                          allInOne: !!checked
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="all-in-one" className="text-sm font-medium">
                          All in One Structure
                        </Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          Organize files by metadata type instead of app folders. Screenshots go to /screenshots/, titles to /title/, etc. Files are named with app prefix (e.g., AppName_1.jpg, AppName_2.jpg).
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Country, Device, and Language */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={appMetadata.country} onValueChange={handleMetadataCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {(countries.length > 0 ? countries.map(country => ({
                          value: country.code,
                          label: `${country.flag || ''} ${country.name}`.trim()
                        })) : countryOptions).map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Device</Label>
                    <Select value={appMetadata.device} onValueChange={(value) => 
                      setAppMetadata({...appMetadata, device: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceOptions.map((device) => (
                          <SelectItem key={device.value} value={device.value}>
                            {device.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={appMetadata.language} onValueChange={(value) => 
                      setAppMetadata({...appMetadata, language: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Language auto-updates based on country selection
                    </div>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <div className="font-medium mb-1">Metadata Pricing</div>
                      <div className="text-xs space-y-1">
                        <div>• 10 credits per app - includes all metadata elements (title, description, screenshots, ratings, etc.)</div>
                        <div>• Language automatically mapped to country to avoid validation errors</div>
                        <div>• Some country/language combinations may not be supported by AppTweak</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button 
                      onClick={fetchAppMetadata} 
                      disabled={isLoadingMetadata} 
                      className="flex-1"
                      variant="outline"
                    >
                      {isLoadingMetadata ? 'Fetching...' : 'Preview Metadata'}
                    </Button>
                    <Button 
                      onClick={downloadMetadata} 
                      disabled={isLoadingMetadata} 
                      className="flex-1"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isLoadingMetadata ? 'Downloading...' : 'Download All (JSON)'}
                    </Button>
                  </div>
                  
                                {appMetadata.selectedElements.length > 0 && (
                <Button 
                  onClick={downloadSelectiveMetadata} 
                  disabled={isLoadingMetadata || !metadataResults} 
                  className="w-full"
                  variant={!metadataResults ? "outline" : "default"}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {isLoadingMetadata ? 'Creating Archive...' : 
                   !metadataResults ? 'Preview Metadata First' : 
                   `Download Selected Elements (${appMetadata.selectedElements.length})`}
                </Button>
              )}
                </div>

                {/* Results Preview */}
                {metadataResults && (
                  <div className="space-y-3">
                    <Label>Metadata Preview</Label>
                    {metadataResults.result && Object.keys(metadataResults.result).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(metadataResults.result).map(([appId, appData]: [string, any]) => (
                          <Card key={appId}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <img 
                                  src={appData.icon} 
                                  alt="App Icon" 
                                  className="h-8 w-8 rounded-lg"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                {appData.title || appId}
                                <Badge variant="secondary">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Metadata
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Basic Info</div>
                                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                                    <div><span className="font-medium">ID:</span> {appId}</div>
                                    {appData.subtitle && <div><span className="font-medium">Subtitle:</span> {appData.subtitle}</div>}
                                    {appData.developer?.name && <div><span className="font-medium">Developer:</span> {appData.developer.name}</div>}
                                    {appData.rating && <div><span className="font-medium">Rating:</span> {appData.rating.toFixed(1)} ⭐</div>}
                                    {appData.price !== undefined && <div><span className="font-medium">Price:</span> {appData.price === 0 ? 'Free' : `$${appData.price}`}</div>}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Technical Details</div>
                                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                                    {appData.size && <div><span className="font-medium">Size:</span> {(appData.size / 1024 / 1024).toFixed(1)} MB</div>}
                                    {appData.genres && appData.genres.length > 0 && (
                                      <div><span className="font-medium">Categories:</span> {appData.genres.join(', ')}</div>
                                    )}
                                    {appData.release_date && <div><span className="font-medium">Released:</span> {new Date(appData.release_date).toLocaleDateString()}</div>}
                                  </div>
                                </div>
                              </div>
                              {appData.description && (
                                <div className="mt-4">
                                  <div className="text-sm font-medium mb-2">Description</div>
                                  <div className="bg-muted p-3 rounded-lg text-sm">
                                    {appData.description.length > 200 ? 
                                      `${appData.description.substring(0, 200)}...` : 
                                      appData.description
                                    }
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        <div className="bg-muted p-4 rounded-lg">
                          <details>
                            <summary className="cursor-pointer font-medium mb-2">
                              Raw JSON Response
                            </summary>
                            <pre className="text-sm overflow-auto">
                              {JSON.stringify(metadataResults, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(metadataResults, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 