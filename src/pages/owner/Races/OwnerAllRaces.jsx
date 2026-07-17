import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments, getTournamentSchedule } from '../../../services/tournamentService'
import { registerHorseToRace, assignJockeyToParticipation, getOwnerHorses } from '../../../services/ownerService'
import { getAllJockeys } from '../../../services/jockeyService'

export default function OwnerAllRaces() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')

  // Data for registration
  const [ownerHorses, setOwnerHorses] = useState([])
  const [jockeysList, setJockeysList] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch horses and jockeys parallel to tournaments
      const [tourRes, horsesRes, jockeysRes] = await Promise.all([
        getAllTournaments(),
        getOwnerHorses().catch(e => { console.error(e); return [] }),
        getAllJockeys().catch(e => { console.error(e); return [] })
      ])

      setOwnerHorses(horsesRes?.data || horsesRes || [])
      setJockeysList(jockeysRes?.data || jockeysRes || [])

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
  const [registrationStep, setRegistrationStep] = useState(0) // 0: detail, 1: choose horse, 2: choose jockey, 3: success
  const [selectedHorseId, setSelectedHorseId] = useState('')
  const [selectedJockeyId, setSelectedJockeyId] = useState('')
  const [participationId, setParticipationId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = (race) => {
    setSelectedRace(race)
    setRegistrationStep(0)
    setSelectedHorseId('')
    setSelectedJockeyId('')
    setParticipationId(null)
  }

  const handleRegisterClick = () => {
    setRegistrationStep(1)
  }

  const handleNextToJockey = async () => {
    if (!selectedHorseId) return alert('Vui lòng chọn ngựa')
    try {
      setIsSubmitting(true)
      const payload = {
        horseId: parseInt(selectedHorseId),
        raceScheduleId: selectedRace.originalId
      }
      const result = await registerHorseToRace(payload)
      // Save participationId for step 2
      if (result && result.id) {
        setParticipationId(result.id)
      }
      setRegistrationStep(2)
    } catch (error) {
      const errorMsg = error.response?.data || error.message || 'Lỗi không xác định'
      alert('Không thể đăng ký ngựa: ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinishRegistration = async () => {
    if (!selectedJockeyId) return alert('Vui lòng chọn Jockey')
    if (!participationId) return alert('Lỗi: Không tìm thấy mã đăng ký từ bước trước!')
    
    try {
      setIsSubmitting(true)
      const payload = {
        jockeyId: parseInt(selectedJockeyId)
      }
      await assignJockeyToParticipation(participationId, payload)
      setRegistrationStep(3)
    } catch (error) {
      const errorMsg = error.response?.data || error.message || 'Lỗi không xác định'
      alert('Không thể gán Jockey: ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)))
    } finally {
      setIsSubmitting(false)
    }
  }

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
                onClick={() => openModal(race)}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '12px', background: 'rgba(18, 18, 18, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', overflow: 'hidden' }}
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
                {(race.status === 'scheduled' || race.status === 'pending') && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', textAlign: 'center' }}>
                    <span style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold' }}>MỞ ĐĂNG KÝ ➔</span>
                  </div>
                )}
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
                <h3 style={{ margin: 0, color: '#fff' }}>
                  {registrationStep === 0 && 'Chi tiết Cuộc đua'}
                  {registrationStep === 1 && 'Đăng ký: Chọn Ngựa (Bước 1/2)'}
                  {registrationStep === 2 && 'Đăng ký: Chọn Jockey (Bước 2/2)'}
                  {registrationStep === 3 && 'Hoàn tất Đăng ký'}
                </h3>
                <span style={{ fontSize: '11px', color: '#d4af37' }}>Mã cuộc đua: {selectedRace.id} | {selectedRace.name}</span>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelectedRace(null)}>✕</button>
            </div>
            
            <div className="admin-card-body">
              {registrationStep === 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                    <div><span style={{ color: '#666' }}>Tên cuộc đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.name}</strong></div>
                    <div><span style={{ color: '#666' }}>Trạng thái:</span> <StatusBadge status={selectedRace.status} /></div>
                    <div><span style={{ color: '#666' }}>Giải đấu:</span> <strong style={{ color: '#fff' }}>{selectedRace.tournament}</strong></div>
                    <div><span style={{ color: '#666' }}>Cự ly:</span> <strong style={{ color: '#d4af37' }}>{selectedRace.distance}</strong></div>
                    <div><span style={{ color: '#666' }}>Ngày đua:</span> <strong style={{ color: '#fff' }}>{selectedRace.date}</strong></div>
                    <div><span style={{ color: '#666' }}>Giờ xuất phát:</span> <strong style={{ color: '#fff' }}>{selectedRace.time}</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelectedRace(null)}>Đóng</button>
                    {(selectedRace.status === 'scheduled' || selectedRace.status === 'pending') && (
                      <button type="button" className="admin-btn admin-btn--primary" onClick={handleRegisterClick}>Đăng ký tham gia ngay</button>
                    )}
                  </div>
                </>
              )}

              {registrationStep === 1 && (
                <>
                  <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>Vui lòng chọn một con ngựa khỏe mạnh để tham gia cuộc đua này.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    {ownerHorses.length === 0 && <div style={{color: '#aaa', textAlign: 'center'}}>Bạn chưa sở hữu con ngựa nào.</div>}
                    {ownerHorses.map(horse => {
                      const isReady = horse.healthStatus === 'ELIGIBLE' || horse.healthStatus === 'ready' || horse.status === 'ready';
                      return (
                      <label key={horse.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: selectedHorseId === horse.id ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: isReady ? 'pointer' : 'not-allowed', background: selectedHorseId === horse.id ? 'rgba(212,175,55,0.1)' : 'transparent', opacity: isReady ? 1 : 0.5 }}>
                        <input type="radio" name="horse" value={horse.id} checked={selectedHorseId === horse.id} onChange={() => isReady && setSelectedHorseId(horse.id)} disabled={!isReady} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold' }}>{horse.name}</div>
                          <div style={{ fontSize: '12px', color: isReady ? '#4caf50' : '#f44336' }}>{isReady ? 'Sẵn sàng' : 'Đang nghỉ ngơi'}</div>
                        </div>
                      </label>
                    )})}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRegistrationStep(0)} disabled={isSubmitting}>Quay lại</button>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={handleNextToJockey} disabled={!selectedHorseId || isSubmitting}>
                      {isSubmitting ? 'Đang gửi...' : 'Tiếp tục chọn Jockey ➔'}
                    </button>
                  </div>
                </>
              )}

              {registrationStep === 2 && (
                <>
                  <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>Ai sẽ là người cưỡi <strong>{ownerHorses.find(h => h.id === selectedHorseId)?.name}</strong>?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    {jockeysList.length === 0 && <div style={{color: '#aaa', textAlign: 'center'}}>Không có Jockey nào trên hệ thống.</div>}
                    {jockeysList.map(jockey => (
                      <label key={jockey.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: selectedJockeyId === jockey.id ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', background: selectedJockeyId === jockey.id ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                        <input type="radio" name="jockey" value={jockey.id} checked={selectedJockeyId === jockey.id} onChange={() => setSelectedJockeyId(jockey.id)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold' }}>{jockey.fullName || jockey.name}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>Jockey tự do</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRegistrationStep(1)} disabled={isSubmitting}>Quay lại</button>
                    <button type="button" className="admin-btn admin-btn--success" onClick={handleFinishRegistration} disabled={!selectedJockeyId || isSubmitting}>
                      {isSubmitting ? 'Đang gửi...' : 'Hoàn tất Đăng ký ✓'}
                    </button>
                  </div>
                </>
              )}

              {registrationStep === 3 && (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ color: '#4caf50', marginBottom: '8px' }}>Gửi đơn đăng ký thành công!</h3>
                  <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>
                    Bạn đã đăng ký ngựa <strong>{ownerHorses.find(h => h.id === selectedHorseId)?.name}</strong> 
                    và nài ngựa <strong>{jockeysList.find(j => j.id === selectedJockeyId)?.fullName || jockeysList.find(j => j.id === selectedJockeyId)?.name}</strong> 
                    tham gia cuộc đua {selectedRace.name}. 
                    <br/><br/>
                    Đơn đăng ký của bạn đang được chuyển đến Admin để phê duyệt.
                  </p>
                  <button type="button" className="admin-btn admin-btn--primary" onClick={() => setSelectedRace(null)}>Đóng & Trở về danh sách</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
