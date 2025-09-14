// UK Postcode validation and delivery area mapping
import { useKV } from '@github/spark/hooks'

export interface PostcodeInfo {
  postcode: string
  district: string
  area: string
  region: string
  country: string
}

export interface DeliveryArea {
  supermarket: string
  available: boolean
  deliveryTimes: string[]
  minOrder: string
  deliveryFee: string
  notes?: string
}

export interface SupermarketCoverage {
  [key: string]: {
    postcodePatterns: string[]
    excludedAreas: string[]
    deliveryInfo: {
      minOrder: string
      deliveryFee: string
      deliveryTimes: string[]
      sameDay: boolean
      nextDay: boolean
    }
  }
}

// UK Supermarket delivery coverage data
export const SUPERMARKET_COVERAGE: SupermarketCoverage = {
  tesco: {
    postcodePatterns: [
      'AL', 'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS', 'BT',
      'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CT', 'CV', 'CW',
      'DA', 'DE', 'DH', 'DL', 'DN', 'DT', 'DY',
      'E', 'EC', 'EN', 'EX',
      'FY', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HU', 'HX',
      'IG', 'IP', 'KT', 'L', 'LA', 'LD', 'LE', 'LN', 'LS', 'LU',
      'M', 'ME', 'MK', 'N', 'NE', 'NG', 'NN', 'NP', 'NR', 'NW',
      'OL', 'OX', 'PE', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM', 'S',
      'SA', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SS',
      'ST', 'SW', 'SY', 'TA', 'TF', 'TN', 'TQ', 'TS', 'TW', 'UB',
      'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO'
    ],
    excludedAreas: ['BT', 'GY', 'JE', 'IM'], // Northern Ireland, Guernsey, Jersey, Isle of Man
    deliveryInfo: {
      minOrder: '£25',
      deliveryFee: '£4.50',
      deliveryTimes: ['9am-12pm', '12pm-3pm', '3pm-6pm', '6pm-9pm'],
      sameDay: false,
      nextDay: true
    }
  },
  asda: {
    postcodePatterns: [
      'B', 'BB', 'BD', 'BL', 'BN', 'BR', 'BS', 'BT',
      'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CV', 'CW',
      'DA', 'DE', 'DH', 'DL', 'DN', 'DY',
      'E', 'EC', 'EN', 'EX',
      'FY', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HU', 'HX',
      'IG', 'IP', 'KT', 'L', 'LA', 'LE', 'LN', 'LS', 'LU',
      'M', 'ME', 'MK', 'N', 'NE', 'NG', 'NN', 'NR', 'NW',
      'OL', 'OX', 'PE', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM', 'S',
      'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SS',
      'ST', 'SW', 'SY', 'TF', 'TN', 'TS', 'TW', 'UB',
      'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO'
    ],
    excludedAreas: ['BT', 'GY', 'JE', 'IM'],
    deliveryInfo: {
      minOrder: '£30',
      deliveryFee: '£3.00',
      deliveryTimes: ['7am-10am', '10am-1pm', '1pm-4pm', '4pm-7pm', '7pm-10pm'],
      sameDay: true,
      nextDay: true
    }
  },
  sainsburys: {
    postcodePatterns: [
      'AL', 'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS',
      'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CT', 'CV', 'CW',
      'DA', 'DE', 'DH', 'DL', 'DN', 'DT', 'DY',
      'E', 'EC', 'EN', 'EX',
      'FY', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HU', 'HX',
      'IG', 'IP', 'KT', 'L', 'LA', 'LD', 'LE', 'LN', 'LS', 'LU',
      'M', 'ME', 'MK', 'N', 'NE', 'NG', 'NN', 'NP', 'NR', 'NW',
      'OL', 'OX', 'PE', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM', 'S',
      'SA', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SS',
      'ST', 'SW', 'SY', 'TA', 'TF', 'TN', 'TQ', 'TS', 'TW', 'UB',
      'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO'
    ],
    excludedAreas: ['BT', 'GY', 'JE', 'IM'],
    deliveryInfo: {
      minOrder: '£25',
      deliveryFee: '£5.00',
      deliveryTimes: ['8am-12pm', '12pm-4pm', '4pm-8pm'],
      sameDay: false,
      nextDay: true
    }
  },
  morrisons: {
    postcodePatterns: [
      'AB', 'AL', 'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS', 'BT',
      'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CT', 'CV', 'CW',
      'DA', 'DD', 'DE', 'DG', 'DH', 'DL', 'DN', 'DT', 'DY',
      'E', 'EC', 'EH', 'EN', 'EX',
      'FK', 'FY', 'G', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HU', 'HX',
      'IG', 'IP', 'KA', 'KT', 'KW', 'KY', 'L', 'LA', 'LD', 'LE', 'LN', 'LS', 'LU',
      'M', 'ME', 'MK', 'ML', 'N', 'NE', 'NG', 'NN', 'NP', 'NR', 'NW',
      'OL', 'OX', 'PA', 'PE', 'PH', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM', 'S',
      'SA', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SR', 'SS',
      'ST', 'SW', 'SY', 'TA', 'TD', 'TF', 'TN', 'TQ', 'TR', 'TS', 'TW', 'UB',
      'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO', 'ZE'
    ],
    excludedAreas: ['GY', 'JE', 'IM'],
    deliveryInfo: {
      minOrder: '£25',
      deliveryFee: '£4.00',
      deliveryTimes: ['9am-12pm', '1pm-4pm', '5pm-8pm'],
      sameDay: false,
      nextDay: true
    }
  }
}

// Validate UK postcode format
export function validateUKPostcode(postcode: string): boolean {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
  
  // UK postcode regex pattern
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?[0-9][ABD-HJLNP-UW-Z]{2}$/
  
  return ukPostcodeRegex.test(cleanPostcode)
}

// Extract area code from postcode (first 1-2 letters)
export function extractPostcodeArea(postcode: string): string {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
  const match = cleanPostcode.match(/^([A-Z]{1,2})/)
  return match ? match[1] : ''
}

// Check if a supermarket delivers to a specific postcode
export function checkDeliveryAvailability(postcode: string, supermarket: string): DeliveryArea {
  const area = extractPostcodeArea(postcode)
  const coverage = SUPERMARKET_COVERAGE[supermarket.toLowerCase()]
  
  if (!coverage) {
    return {
      supermarket,
      available: false,
      deliveryTimes: [],
      minOrder: '£0',
      deliveryFee: '£0',
      notes: 'Supermarket not supported'
    }
  }
  
  const isExcluded = coverage.excludedAreas.includes(area)
  const isSupported = coverage.postcodePatterns.includes(area)
  
  return {
    supermarket,
    available: isSupported && !isExcluded,
    deliveryTimes: coverage.deliveryInfo.deliveryTimes,
    minOrder: coverage.deliveryInfo.minOrder,
    deliveryFee: coverage.deliveryInfo.deliveryFee,
    notes: isExcluded ? 'Not available in this area' : isSupported ? undefined : 'Area not covered'
  }
}

// Get delivery availability for all supermarkets
export function getAllDeliveryAvailability(postcode: string): DeliveryArea[] {
  return Object.keys(SUPERMARKET_COVERAGE).map(supermarket => 
    checkDeliveryAvailability(postcode, supermarket)
  )
}

// Format postcode for display
export function formatPostcode(postcode: string): string {
  const clean = postcode.replace(/\s/g, '').toUpperCase()
  if (clean.length < 5) return clean
  
  const outward = clean.slice(0, -3)
  const inward = clean.slice(-3)
  return `${outward} ${inward}`
}

// Parse postcode information (mock implementation - in real app would use postal API)
export async function getPostcodeInfo(postcode: string): Promise<PostcodeInfo | null> {
  if (!validateUKPostcode(postcode)) {
    return null
  }

  const area = extractPostcodeArea(postcode)
  
  // Mock postcode data - in production would use APIs like postcodes.io
  const mockData: { [key: string]: Partial<PostcodeInfo> } = {
    'SW': { district: 'South West London', area: 'London', region: 'London', country: 'England' },
    'E': { district: 'East London', area: 'London', region: 'London', country: 'England' },
    'W': { district: 'West London', area: 'London', region: 'London', country: 'England' },
    'N': { district: 'North London', area: 'London', region: 'London', country: 'England' },
    'M': { district: 'Manchester', area: 'Greater Manchester', region: 'North West England', country: 'England' },
    'B': { district: 'Birmingham', area: 'West Midlands', region: 'West Midlands', country: 'England' },
    'L': { district: 'Liverpool', area: 'Merseyside', region: 'North West England', country: 'England' },
    'LS': { district: 'Leeds', area: 'West Yorkshire', region: 'Yorkshire and The Humber', country: 'England' },
    'S': { district: 'Sheffield', area: 'South Yorkshire', region: 'Yorkshire and The Humber', country: 'England' },
    'NE': { district: 'Newcastle', area: 'Tyne and Wear', region: 'North East England', country: 'England' },
    'CF': { district: 'Cardiff', area: 'Cardiff', region: 'Wales', country: 'Wales' },
    'G': { district: 'Glasgow', area: 'Glasgow', region: 'Scotland', country: 'Scotland' },
    'EH': { district: 'Edinburgh', area: 'Edinburgh', region: 'Scotland', country: 'Scotland' },
    'BT': { district: 'Belfast', area: 'Belfast', region: 'Northern Ireland', country: 'Northern Ireland' }
  }
  
  const data = mockData[area] || { 
    district: `${area} District`, 
    area: `${area} Area`, 
    region: 'England', 
    country: 'England' 
  }
  
  return {
    postcode: formatPostcode(postcode),
    district: data.district!,
    area: data.area!,
    region: data.region!,
    country: data.country!
  }
}