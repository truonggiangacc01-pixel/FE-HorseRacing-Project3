import React, { useState, useEffect } from 'react'
import { ownerHorses as initialHorses, ownerRaces } from '../../../data/ownerMockData'
import * as ownerService from '../../../services/ownerService'
import * as horseService from '../../../services/horseService'
export default function OwnerHorses() {
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [newHorseModal, setNewHorseModal] = useState(false)
  const [editHorseModal, setEditHorseModal] = useState(false)
  const [registerModal, setRegisterModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  const [horseHistory, setHorseHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [breed, setBreed] = useState('Thoroughbred')
  
  // Registration Form fields
  const [selectedRaceId, setSelectedRaceId] = useState('')

  // ── Fetch horses from API on mount ──
  useEffect(() => {
    async function loadHorses() {
      try {
        setLoading(true)
        const data = await ownerService.getOwnerHorses()
        // API response format validation
        const list = Array.isArray(data) ? data : data?.data ?? data?.content ?? []
        
        // Map API fields (stable-owner attributes) if needed
        const formatted = list.map(h => ({
          id:            h.id ?? h.horseId ?? `HRS-00${Math.floor(Math.random() * 1000)}`,
          name:          h.name ?? h.fullName ?? 'Chưa đặt tên',
          breed:         h.breed ?? 'Thoroughbred',
          age:           h.age ?? 3,
          wins:          h.wins ?? 0,
          races:         h.racesCount ?? h.races ?? 0,
          earnings:      h.earnings ?? '0 VND',
          status:        (h.healthStatus === 'ELIGIBLE' || !h.healthStatus) ? 'ready' : 'gray',
          currentJockey: h.jockeyName ?? null
        }))
        setHorses(formatted)
      } catch (err) {
        console.warn('API getOwnerHorses lỗi, dùng dữ liệu giả lập:', err.message)
        // Fallback to initial mock data during dev
        setHorses(initialHorses)
      } finally {
        setLoading(false)
      }
    }
    loadHorses()
  }, [])

  const handleAddHorse = async (e) => {
    e.preventDefault()
    if (!name || !age) return
    
    const payload = {
      name,
      age: parseInt(age, 10),
      breed,
      healthStatus: 'ELIGIBLE'
    }

    try {
      const data = await ownerService.createOwnerHorse(payload)
      const newHorse = {
        id:            data?.id ?? `HRS-00${horses.length + 1}`,
        name:          data?.name ?? name,
        age:           data?.age ?? parseInt(age, 10),
        breed:         data?.breed ?? breed,
        wins:          0,
        races:         0,
        earnings:      '0 VND',
        status:        'ready',
        currentJockey: null
      }
      setHorses([...horses, newHorse])
      alert('✅ Đăng ký ngựa mới thành công!')
    } catch (err) {
      console.warn('Đăng ký ngựa qua API lỗi, tạo cục bộ:', err.message)
      // Fallback: Create locally
      const localNew = {
        id: `HRS-00${horses.length + 1}`,
        ...payload,
        wins: 0,
        races: 0,
        earnings: '0 VND',
        currentJockey: null,
        lastRace: 'Mới đăng ký'
      }
      setHorses([...horses, localNew])
      alert('⚠️ Đăng ký ngựa thành công (Dữ liệu lưu tạm thời)')
    }

    setNewHorseModal(false)
    setName('')
    setAge('')
  }

  const openNewHorseModal = () => {
    setName('')
    setAge('')
    setBreed('Thoroughbred')
    setNewHorseModal(true)
  }

  const openEditModal = (horse) => {
    setSelectedHorse(horse)
    setName(horse.name)
    setAge(horse.age)
    setBreed(horse.breed)
    setEditHorseModal(true)
  }

  const openHistoryModal = async (horse) => {
    setSelectedHorse(horse)
    setHistoryModal(true)
    setLoadingHistory(true)
    try {
      const history = await horseService.getHorseHistory(horse.id)
      setHorseHistory(history || [])
    } catch (err) {
      console.error('Failed to load history:', err)
      setHorseHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEditHorse = async (e) => {
    e.preventDefault()
    if (!selectedHorse || !name || !age) return
    
    const payload = {
      name,
      age: parseInt(age, 10),
      breed,
      healthStatus: 'ELIGIBLE'
    }

    try {
      const updatedData = await ownerService.updateOwnerHorse(selectedHorse.id, payload)
      // Update local state
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return {
            ...h,
            name: updatedData?.name ?? name,
            age: updatedData?.age ?? parseInt(age, 10),
            breed: updatedData?.breed ?? breed
          }
        }
        return h
      }))
      alert('✅ Cập nhật thông tin ngựa thành công!')
    } catch (err) {
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || err.message)
      alert('❌ Lỗi khi cập nhật thông tin ngựa: ' + errorMessage)
    }

    setEditHorseModal(false)
  }

  const openRegisterModal = (horse) => {
    setSelectedHorse(horse)
    const availableRaces = ownerRaces.filter(r => r.status === 'upcoming')
    if (availableRaces.length > 0) {
      setSelectedRaceId(availableRaces[0].id)
    }
    setRegisterModal(true)
  }

  const handleRegisterToRace = async (e) => {
    e.preventDefault()
    if (!selectedHorse || !selectedRaceId) return
    
    try {
      await ownerService.registerHorseToRace({
        horseId: selectedHorse.id,
        raceScheduleId: selectedRaceId
      })
      
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return { ...h, status: 'registered' }
        }
        return h
      }))
      alert(`✅ Đăng ký thành công ngựa "${selectedHorse.name}" vào giải đấu!`)
    } catch (err) {
      console.warn('Đăng ký giải đấu qua API lỗi, xử lý cục bộ:', err.message)
      // Fallback
      setHorses(horses.map(h => {
        if (h.id === selectedHorse.id) {
          return { ...h, status: 'registered' }
        }
        return h
      }))
      alert(`⚠️ Đăng ký thành công ngựa "${selectedHorse.name}" vào giải đấu (Lưu tạm thời)`)
    }
    
    setRegisterModal(false)
  }

  if (loading) {
    return (
      <div className="own-horses" style={{ padding: 20, color: '#aaa' }}>
        <h2>Chiến mã của Stable</h2>
        <p>Đang tải thông tin ngựa từ hệ thống...</p>
      </div>
    )
  }

  return (
    <div className="own-horses">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Quản lý thông tin ngựa 🐴</h1>
          <p className="owner-page-sub">Danh sách các chiến mã thuộc trang trại của bạn.</p>
        </div>
        <button className="owner-btn owner-btn--gold" onClick={openNewHorseModal}>
          + Đăng Ký Ngựa Mới
        </button>
      </div>

      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Chiến mã của Stable ({horses.length})</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Mã ngựa</th>
                <th>Tên ngựa</th>
                <th>Giống</th>
                <th>Tuổi</th>
                <th>Thành tích</th>
                <th>Trạng thái</th>
                <th>Jockey chính</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr key={horse.id}>
                  <td>{horse.id}</td>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{horse.name}</td>
                  <td>{horse.breed}</td>
                  <td>{horse.age} tuổi</td>
                  <td>{horse.wins} Thắng / {horse.races} Đua</td>
                  <td>
                    <span className={`owner-badge owner-badge--${
                      horse.status === 'ready' ? 'green' : horse.status === 'registered' ? 'gold' : 'gray'
                    }`}>
                      {horse.status === 'ready' ? 'Sẵn sàng' : horse.status === 'registered' ? 'Đã đăng ký' : 'Đang nghỉ dưỡng'}
                    </span>
                  </td>
                  <td>{horse.currentJockey || 'Chưa chỉ định'}</td>
                  <td>
                    <div className="owner-table-actions">
                      <button 
                        className="owner-btn owner-btn--outline owner-btn--sm"
                        disabled={horse.status === 'registered'}
                        onClick={() => openEditModal(horse)}
                        style={{ marginRight: '8px' }}
                      >
                        Sửa
                      </button>
                      <button 
                        className="owner-btn owner-btn--outline owner-btn--sm"
                        onClick={() => openHistoryModal(horse)}
                        style={{ marginRight: '8px' }}
                      >
                        Chi tiết
                      </button>
                      <button 
                        className="owner-btn owner-btn--outline owner-btn--sm"
                        disabled={horse.status === 'registered'}
                        onClick={() => openRegisterModal(horse)}
                      >
                        Đăng ký giải đấu
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Horse Form */}
      {newHorseModal && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Đăng ký tài khoản ngựa tham gia hệ thống</h2>
              <button className="owner-modal-close" onClick={() => setNewHorseModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddHorse}>
              <div className="owner-modal-body">
                <div className="owner-form-grid">
                  <div className="owner-form-group full">
                    <label className="owner-label">Tên chiến mã</label>
                    <input
                      type="text"
                      className="owner-input"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Xích Thố Vương"
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Tuổi</label>
                    <input
                      type="number"
                      className="owner-input"
                      required
                      min="2"
                      max="15"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="owner-form-group">
                    <label className="owner-label">Giống ngựa</label>
                    <input
                      type="text"
                      className="owner-input"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>

                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setNewHorseModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Horse Form */}
      {editHorseModal && selectedHorse && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Cập nhật thông tin chiến mã</h2>
              <button className="owner-modal-close" onClick={() => setEditHorseModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditHorse}>
              <div className="owner-modal-body">
                <div className="owner-form-grid">
                  <div className="owner-form-group full">
                    <label className="owner-label">Tên chiến mã</label>
                    <input
                      type="text"
                      className="owner-input"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Tuổi</label>
                    <input
                      type="number"
                      className="owner-input"
                      required
                      min="2"
                      max="15"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="owner-form-group">
                    <label className="owner-label">Giống ngựa</label>
                    <input
                      type="text"
                      className="owner-input"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setEditHorseModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold">
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Horse to Tournament */}
      {registerModal && selectedHorse && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Đăng ký giải đấu cho {selectedHorse.name}</h2>
              <button className="owner-modal-close" onClick={() => setRegisterModal(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterToRace}>
              <div className="owner-modal-body">
                <div className="owner-form-group full" style={{ marginBottom: 16 }}>
                  <label className="owner-label">Chọn Giải Đấu đang mở</label>
                  <select 
                    className="owner-select" 
                    style={{ width: '100%', marginTop: 8 }}
                    value={selectedRaceId}
                    onChange={(e) => setSelectedRaceId(e.target.value)}
                  >
                    {ownerRaces.filter(r => r.status === 'upcoming').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} - ({r.distance} | Thưởng: {r.prizePool})
                      </option>
                    ))}
                    {ownerRaces.filter(r => r.status === 'upcoming').length === 0 && (
                      <option value="">Không có giải đấu nào đang mở đăng ký</option>
                    )}
                  </select>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 12, fontSize: 13 }}>
                  <p style={{ margin: '0 0 8px' }}><strong>Lưu ý đăng ký:</strong></p>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>Phí tham gia giải đấu: 10,000,000 VND sẽ trừ vào tài khoản stable.</li>
                    <li>Chiến mã cần ở trạng thái Sẵn sàng và không có chấn thương.</li>
                    <li>Ban tổ chức sẽ phê duyệt hồ sơ trong vòng 24 giờ.</li>
                  </ul>
                </div>
              </div>
              <div className="owner-modal-footer">
                <button type="button" className="owner-btn owner-btn--ghost" onClick={() => setRegisterModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="owner-btn owner-btn--gold" disabled={!selectedRaceId}>
                  Xác Nhận Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: History */}
      {historyModal && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <div className="owner-modal-head">
              <h2>Chi tiết & Lịch sử thi đấu</h2>
              <button className="owner-modal-close" onClick={() => setHistoryModal(false)}>×</button>
            </div>
            <div className="owner-modal-body">
              {selectedHorse && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#d4af37', marginBottom: '8px' }}>{selectedHorse.name}</h3>
                  <div style={{ fontSize: '13px', color: '#ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><strong>Giống:</strong> {selectedHorse.breed}</div>
                    <div><strong>Tuổi:</strong> {selectedHorse.age}</div>
                    <div><strong>Sức khỏe:</strong> {selectedHorse.health || 'Khỏe mạnh'}</div>
                    <div><strong>Trạng thái:</strong> {selectedHorse.status === 'ready' ? 'Sẵn sàng' : selectedHorse.status === 'registered' ? 'Đã đăng ký' : 'Đang nghỉ'}</div>
                  </div>
                </div>
              )}
              
              <h4 style={{ color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Lịch sử tham gia giải đấu</h4>
              
              {loadingHistory ? (
                <div style={{ color: '#aaa', padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
              ) : horseHistory.length === 0 ? (
                <div style={{ color: '#aaa', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  Ngựa này chưa tham gia giải đấu nào.
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {horseHistory.map((race, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #d4af37' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#e5e5e5' }}>{race.raceName || `Trận #${race.raceId}`}</strong>
                        <span style={{ color: race.placement === 1 ? '#4ade80' : '#d4af37', fontWeight: 'bold' }}>
                          Hạng {race.placement}
                        </span>
                      </div>
                      <div style={{ color: '#888', fontSize: '12px' }}>Thời gian hoàn thành: {race.completionTime} giây</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
