import { useState, useEffect } from 'react'
import { Bluetooth, Heart, Flame, Watch } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function BluetoothTracker() {
  const [device, setDevice] = useState<any>(null)
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0)
  const [sessionActive, setSessionActive] = useState<boolean>(false)
  const [timeMin, setTimeMin] = useState<number>(0)

  const { user } = useAuthStore()

  useEffect(() => {
    let interval: any;
    if (sessionActive) {
      interval = setInterval(() => {
        setTimeMin((t) => t + 1/60);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (sessionActive && heartRate && user?.age && user?.weight_kg) {
      // Keytel Formula (2005) for Energy Expenditure
      const g = user.gender === 'female' ? 1 : 0;
      const age = user.age || 25;
      const weight = user.weight_kg || 70;
      
      let cals_per_min = 0;
      if (g === 1) {
        cals_per_min = ((age * 0.074) - (weight * 0.05741) + (heartRate * 0.4472) - 20.4022) / 4.184;
      } else {
        cals_per_min = ((age * 0.2017) - (weight * 0.09036) + (heartRate * 0.6309) - 55.0969) / 4.184;
      }
      
      // Update by seconds value
      setCaloriesBurned((prev) => prev + Math.max(0, cals_per_min / 60));
    }
  }, [heartRate, sessionActive, timeMin]);

  const connectDevice = async () => {
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      })
      setDevice(dev)
      
      const server = await dev.gatt?.connect()
      const service = await server?.getPrimaryService('heart_rate')
      const characteristic = await service?.getCharacteristic('heart_rate_measurement')
      
      await characteristic?.startNotifications()
      characteristic?.addEventListener('characteristicvaluechanged', handleHeartRate)
      
      setSessionActive(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleHeartRate = (event: any) => {
    const value = event.target.value
    const flags = value.getUint8(0)
    const hr16 = flags & 1
    const hr = hr16 ? value.getUint16(1, true) : value.getUint8(1)
    setHeartRate(hr)
  }

  const disconnect = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    setDevice(null)
    setSessionActive(false)
    setHeartRate(null)
  }

  return (
    <div className="neon-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Watch size={20} className="text-neon-blue" /> Live Session Tracker
        </h3>
        {device ? (
          <div className="flex items-center gap-2">
            <span className="stat-pill text-xs bg-red-500/10 text-red-400 border-red-500/20 px-3 cursor-pointer hover:bg-red-500/20" onClick={disconnect}>
              Disconnect
            </span>
            <span className="stat-pill">
              <span className="h-2 w-2 rounded-full bg-neon animate-pulse" /> Connected
            </span>
          </div>
        ) : (
          <button onClick={connectDevice} className="btn-ghost py-1.5 px-3 text-xs">
            <Bluetooth size={14} /> Pair Wearable
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[18px] border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center">
          <Heart size={24} className={heartRate ? "text-[#ff4b4b] pulse-glow-anim" : "text-white/20"} />
          <p className="mt-2 text-3xl font-display font-bold">
            {heartRate || '--'} <span className="text-sm font-normal text-white/40">bpm</span>
          </p>
        </div>
        
        <div className="rounded-[18px] border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center">
          <Flame size={24} className={caloriesBurned > 0 ? "text-plasma" : "text-white/20"} />
          <p className="mt-2 text-3xl font-display font-bold text-plasma">
            {caloriesBurned.toFixed(1)} <span className="text-sm font-normal text-white/40">kcal</span>
          </p>
        </div>
      </div>
      
      {sessionActive && (
        <p className="mt-4 text-center text-xs text-white/40 font-mono">
          Session time: {Math.floor(timeMin)}m {Math.floor((timeMin * 60) % 60)}s
        </p>
      )}
    </div>
  )
}
