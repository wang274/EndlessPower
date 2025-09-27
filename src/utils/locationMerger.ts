import { Station } from '../types/station'
import { 
  HardcodedStationLocation, 
  getHardcodedLocationById, 
  getHardcodedLocationByName 
} from '../data/stationLocations'

/**
 * 位置合并结果接口
 */
export interface LocationMergeResult {
  station: Station
  isHardcoded: boolean
  matchType?: 'id' | 'name'
  originalLocation?: {
    latitude: number
    longitude: number
  }
  hardcodedLocation?: HardcodedStationLocation
}

/**
 * 合并单个充电桩的位置信息
 * 优先使用硬编码位置，如果没有则使用API位置
 */
export function mergeStationLocation(apiStation: Station): LocationMergeResult {
  // 首先尝试通过ID匹配
  let hardcodedLocation = getHardcodedLocationById(apiStation.stationId)
  let matchType: 'id' | 'name' | undefined = hardcodedLocation ? 'id' : undefined

  // 如果ID匹配失败，尝试通过名称匹配
  if (!hardcodedLocation) {
    hardcodedLocation = getHardcodedLocationByName(apiStation.stationName)
    matchType = hardcodedLocation ? 'name' : undefined
  }

  // 保存原始位置信息
  const originalLocation = {
    latitude: apiStation.latitude,
    longitude: apiStation.longitude
  }

  // 如果找到硬编码位置，使用硬编码数据
  if (hardcodedLocation) {
    const mergedStation: Station = {
      ...apiStation,
      latitude: hardcodedLocation.latitude,
      longitude: hardcodedLocation.longitude,
      // 如果硬编码位置有地址信息，也可以覆盖
      address: hardcodedLocation.address || apiStation.address
    }

    return {
      station: mergedStation,
      isHardcoded: true,
      matchType,
      originalLocation,
      hardcodedLocation
    }
  }

  // 没有找到硬编码位置，使用API原始位置
  return {
    station: apiStation,
    isHardcoded: false,
    originalLocation
  }
}

/**
 * 批量合并充电桩位置信息
 */
export function mergeStationsLocations(apiStations: Station[]): LocationMergeResult[] {
  return apiStations.map(station => mergeStationLocation(station))
}

/**
 * 从合并结果中提取充电桩数据
 */
export function extractMergedStations(mergeResults: LocationMergeResult[]): Station[] {
  return mergeResults.map(result => result.station)
}

/**
 * 获取位置合并的统计信息
 */
export function getLocationMergeStats(mergeResults: LocationMergeResult[]) {
  const stats = {
    total: mergeResults.length,
    hardcoded: 0,
    apiOnly: 0,
    idMatches: 0,
    nameMatches: 0,
    details: [] as Array<{
      stationId: number
      stationName: string
      isHardcoded: boolean
      matchType?: string
      distanceKm?: number
    }>
  }

  mergeResults.forEach(result => {
    if (result.isHardcoded) {
      stats.hardcoded++
      if (result.matchType === 'id') stats.idMatches++
      if (result.matchType === 'name') stats.nameMatches++
    } else {
      stats.apiOnly++
    }

    // 计算位置差距（如果有硬编码位置的话）
    let distanceKm: number | undefined
    if (result.isHardcoded && result.originalLocation && result.hardcodedLocation) {
      distanceKm = calculateDistance(
        result.originalLocation.latitude,
        result.originalLocation.longitude,
        result.hardcodedLocation.latitude,
        result.hardcodedLocation.longitude
      )
    }

    stats.details.push({
      stationId: result.station.stationId,
      stationName: result.station.stationName,
      isHardcoded: result.isHardcoded,
      matchType: result.matchType,
      distanceKm
    })
  })

  return stats
}

/**
 * 计算两个地理坐标之间的距离（公里）
 * 使用 Haversine 公式
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

/**
 * 调试函数：打印位置合并的详细信息
 */
export function debugLocationMerge(mergeResults: LocationMergeResult[], showDetails = false) {
  const stats = getLocationMergeStats(mergeResults)
  
  const isDevMode = showDetails || (typeof window !== 'undefined' && window.location.hostname.includes('dev'))
  
  if (isDevMode) {
    console.log('🗺️ 充电桩位置合并统计:')
    console.log(`   总数: ${stats.total}`)
    console.log(`   硬编码位置: ${stats.hardcoded} (${(stats.hardcoded/stats.total*100).toFixed(1)}%)`)
    console.log(`   API位置: ${stats.apiOnly} (${(stats.apiOnly/stats.total*100).toFixed(1)}%)`)
    console.log(`   ID匹配: ${stats.idMatches}`)
    console.log(`   名称匹配: ${stats.nameMatches}`)
  }

  if (showDetails && isDevMode) {
    console.log('\n📍 详细信息:')
    stats.details.forEach(detail => {
      const status = detail.isHardcoded 
        ? `✅ 硬编码 (${detail.matchType})` 
        : '🌐 API'
      const distance = detail.distanceKm 
        ? `, 距离差: ${detail.distanceKm.toFixed(2)}km` 
        : ''
      console.log(`   ${detail.stationName}: ${status}${distance}`)
    })
  }

  return stats
}
