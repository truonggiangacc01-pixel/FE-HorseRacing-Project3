import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'

export default function JockeyAllRaces() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const tourRes = await getAllTournaments()
      const fetchedTournaments = tourRes.data || tourRes || []

      if (fetchedTournaments && fetchedTournaments.length > 0) {
        const allRaces = []
        for (const t of fetchedTournaments) {
          try {
            const scheduleRes = await getTournamentSchedule(t.id)
            const schedules = scheduleRes.data || []
            const formattedSchedules = schedules.map(s => ({
              id: `R-${s.id}`,
              originalId: s.id,
              name: s.name,
              tournament: t.name,
              tournamentId: t.id,
              date: s.raceDate || (s.startTime ? s.startTime.split('T')[0] : 'N/A'),
              time: s.startTime ? s.startTime.split('T')[1].substring(0, 5) : '00:00',
              distance: '1600m', // Default
              status: s.status ? s.status.toLowerCase() : 'pending',
              horses: 0
            }))
            allRaces.push(...formattedSchedules)
          } catch (err) {
            console.error(`Error fetching schedules for tournament ${t.id}`, err)
          }
        }
        setRaces(allRaces)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and Sort Races
  const filteredRaces = races
    .filter(race => {
      const q = localSearchQuery.toLowerCase()
      if (q && !race.name.toLowerCase().includes(q) && !race.tournament.toLowerCase().includes(q) && !race.id.toLowerCase().includes(q)) return false
      if (statusFilter !== 'ALL' && race.status !== statusFilter.toLowerCase()) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') return new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)
      if (sortOrder === 'OLDEST') return new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)
      if (sortOrder === 'NAME_AZ') return a.name.localeCompare(b.name)
      return 0
    })

  const [selectedRace, setSelectedRace] = useState(null)

  return (
    <div className="race-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Danh sách Cuộc đua</h1>
          <p className="admin-page-sub">Theo dõi tất cả các cuộc đua trên hệ thống</p>
        </div>
      </div>

      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="admin-input" 
          placeholder="Tìm theo tên hoặc giải đấu..." 
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          style={{ minWidth: '220px', flex: 1, maxWidth: '300px' }}
        />
        <select 
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="ALL">Tất cả Trạng thái</option>
          <option value="scheduled">Đã lên lịch</option>
          <option value="pending">Chờ xử lý</option>
          <option value="delayed">Bị hoãn</option>
          <option value="running">Đang chạy</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select 
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="NEWEST">Sắp xếp: Mới nhất</option>
          <option value="OLDEST">Sắp xếp: Cũ nhất</option>
          <option value="NAME_AZ">Sắp xếp: Tên A ➔ Z</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải dữ liệu...</div>
      ) : (
        <div className="race-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredRaces.length > 0 ? (
            filteredRaces.map((race) => (
              <div 
                key={race.id} 
                className="admin-card race-card-item" 
                onClick={() => setSelectedRace(race)}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '12px', background: 'rgba(18, 18, 18, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                <div className="race-card-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="race-card-id" style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold' }}>{race.id}</span>
                  <StatusBadge status={race.status} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>{race.name}</h3>
                <p className="race-card-tournament" style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#888' }}>{race.tournament}</p>
                <div className="race-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#bbb' }}>
                  <span>📅 {race.date} · ⏰ {race.time}</span>
                  <span>📏 Cự ly: {race.distance}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#666', gridColumn: '1 / -1' }}>
              Không có cuộc đua nào phù hợp.
            </div>
          )}
        </div>
      )}

      {selectedRace && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '600px', border: '1px solid rgba(212,175,55,0.15)', background: '#121212', borderRadius: '12px', padding: '20px' }}>
            <div className="admin-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>Chi tiết Cuộc đua</h3>
                <span style={{ fontSize: '11px', color: '#d4af37' }}>Mã cuộc đua: {selectedRace.id}</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div><span style={{ color: '#666' }}>Tên cuộc đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.name}</strong></div>
                <div><span style={{ color: '#666' }}>Trạng thái:</span> <StatusBadge status={selectedRace.status} /></div>
                <div><span style={{ color: '#666' }}>Giải đấu:</span> <strong style={{ color: '#fff' }}>{selectedRace.tournament}</strong></div>
                <div><span style={{ color: '#666' }}>Cự ly:</span> <strong style={{ color: '#d4af37' }}>{selectedRace.distance}</strong></div>
                <div><span style={{ color: '#666' }}>Ngày đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.date}</strong></div>
                <div><span style={{ color: '#666' }}>Giờ xuất phát:</span> <strong style={{ color: '#fff' }}>{selectedRace.time}</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="admin-btn admin-btn--gold" onClick={() => setSelectedRace(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
