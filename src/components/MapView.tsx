import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import { useSEO } from '../hooks/useSEO'
import L from 'leaflet'
import { Station } from '../types/station'
import { useStationStore } from '../store/stationStore'
import { useErrorStore } from '../store/errorStore'
import { useThemeStore } from '../store/themeStore'
import { useSettingsStore } from '../store/settingsStore'
import { getColorForAvailability } from '../utils/api'
import SearchBar from './SearchBar'
import StationDetailPanel from './StationDetailPanel'
import LoadingSpinner from './LoadingSpinner'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined'
import QrCodeScannerOutlined from '@mui/icons-material/QrCodeScannerOutlined'

const MAP_CENTER: [number, number] = [30.754365, 103.936107]

const MapView: React.FC = () => {
  // SEO优化
  useSEO('home')
  
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  
  const { 
    getFilteredStations, 
    isLoading, 
    refreshStations, 
    canRefresh,
    setUserLocation: setStoreUserLocation 
  } = useStationStore()
  
  const { showError } = useErrorStore()
  const { isDark } = useThemeStore()
  const { showUnavailableStations, autoRefresh, refreshInterval } = useSettingsStore()
  
  const stations = getFilteredStations()

  useEffect(() => {
    // 尝试获取用户位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location: [number, number] = [latitude, longitude]
          setUserLocation(location)
          setStoreUserLocation(location)
          
          // 将地图中心移动到用户位置
          if (mapRef.current) {
            mapRef.current.setView(location, 16)
          }
        },
        (error) => {
          if (import.meta.env.DEV) console.warn('Failed to get user location:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    }
  }, [setStoreUserLocation])

  // 自动刷新功能
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(async () => {
      if (canRefresh()) {
        const lat = userLocation?.[0]
        const lng = userLocation?.[1]
        await refreshStations(lat, lng)
      }
    }, refreshInterval * 1000) // 转换为毫秒

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, userLocation, canRefresh, refreshStations])

  const createMarkerIcon = (color: string) => {
    return L.divIcon({
      className: 'leaflet-div-icon',
      html: `<div class="map-marker" style="background-color: ${color};"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }

  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'user-location-marker',
      html: '<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    })
  }

  const handleRefresh = async () => {
    if (!canRefresh()) return
    
    const lat = userLocation?.[0]
    const lng = userLocation?.[1]
    
    await refreshStations(lat, lng)
  }

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showError('您的浏览器不支持地理位置功能')
      return
    }

    if (isLocating) {
      return // 防止重复请求
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const location: [number, number] = [latitude, longitude]
          
          setUserLocation(location)
          setStoreUserLocation(location)
          
          // 移动地图到用户位置
          if (mapRef.current) {
            mapRef.current.setView(location, 16)
          }
          
          // 刷新该位置的充电站
          await refreshStations(latitude, longitude)
        } catch (error) {
          showError('刷新充电站数据时出错')
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        switch(error.code) {
          case error.PERMISSION_DENIED:
            showError('用户拒绝了地理位置请求')
            break
          case error.POSITION_UNAVAILABLE:
            showError('位置信息不可用')
            break
          case error.TIMEOUT:
            showError('获取位置信息超时')
            break
          default:
            showError('获取地理位置时发生未知错误')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleWeChatScan = () => {
    try {
      // 尝试打开微信扫一扫
      window.location.href = 'weixin://scanqrcode'
    } catch (error) {
      console.warn('无法打开微信扫一扫，可能是设备不支持或未安装微信', error)
    }
  }

  const getStationMarkerColor = (station: Station) => {
    if (!station.freeNum || !station.switchType || station.switchType === 0) {
      return '#9ca3af' // gray for unknown status
    }
    
    const ratio = station.freeNum / station.switchType
    return getColorForAvailability(ratio)
  }

  // 判断充电桩是否有可用插座
  const hasAvailableOutlets = (station: Station) => {
    return station.freeNum && station.freeNum > 0
  }

  // 根据设置过滤充电桩 - 使用 useMemo 确保响应式更新
  const displayStations = useMemo(() => {
    if (showUnavailableStations) {
      return stations // 显示所有充电桩
    } else {
      return stations.filter(hasAvailableOutlets) // 只显示有可用插座的充电桩
    }
  }, [stations, showUnavailableStations])

  // 处理搜索框选择充电桩
  const handleStationSelectFromSearch = (station: Station) => {
    // 定位地图到选择的充电桩
    if (mapRef.current) {
      mapRef.current.setView([station.latitude, station.longitude], 18, {
        animate: true,
        duration: 1
      })
    }
    // 可选：同时打开该充电桩的详情面板
    setSelectedStation(station)
  }

  return (
    <div className="w-full h-full relative">
      <SearchBar onStationSelect={handleStationSelectFromSearch} />
      
      {/* Map Container */}
      <MapContainer
        center={userLocation || MAP_CENTER}
        zoom={16}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://wprd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
          subdomains={['1', '2', '3', '4']}
          attribution="&copy; 高德地图"
        />
        
        {/* Station Markers */}
        {displayStations.map((station) => (
          <Marker
            key={station.stationId}
            position={[station.latitude, station.longitude]}
            icon={createMarkerIcon(getStationMarkerColor(station))}
            eventHandlers={{
              click: () => setSelectedStation(station)
            }}
          >
            <Tooltip
              permanent={false}
              direction="top"
              offset={[0, -12]}
              className="station-tooltip"
            >
              {station.stationName}
            </Tooltip>
          </Marker>
        ))}
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={createUserLocationIcon()}
          />
        )}
      </MapContainer>

      {/* 暗色模式覆盖层 */}
      {isDark && (
        <div 
          className="absolute inset-0 pointer-events-none z-[401] transition-opacity duration-300"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            mixBlendMode: 'multiply'
          }}
        />
      )}


      {/* Control Buttons */}
      <button
        onClick={handleRefresh}
        className="absolute bottom-6 right-6 z-[999] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all min-w-[56px] min-h-[56px] flex items-center justify-center"
        aria-label="刷新充电站数据"
        type="button"
      >
        <RefreshOutlined className="h-6 w-6" />
      </button>

      <button
        onClick={handleLocateUser}
        disabled={isLocating}
        className="absolute bottom-6 right-20 z-[999] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 min-w-[56px] min-h-[56px] flex items-center justify-center"
        aria-label={isLocating ? "定位中..." : "定位当前位置"}
        type="button"
      >
        <MyLocationOutlined className="h-6 w-6" />
      </button>

      <button
        onClick={handleWeChatScan}
        className="absolute bottom-6 right-36 z-[999] bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all min-w-[56px] min-h-[56px] flex items-center justify-center"
        aria-label="微信扫一扫"
        type="button"
      >
        <QrCodeScannerOutlined className="h-6 w-6" />
      </button>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-xl backdrop-blur-sm">
          <LoadingSpinner text="刷新状态..." />
        </div>
      )}

      {/* Station Detail Panel */}
      <StationDetailPanel
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
      />

    </div>
  )
}

export default MapView
