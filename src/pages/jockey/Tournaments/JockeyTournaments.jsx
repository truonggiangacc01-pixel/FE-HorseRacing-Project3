import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { tournaments as initialTournaments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import { getAllTournaments } from '../../../services/tournamentService'
import '../../admin/Tournaments/TournamentManagement.css' // Reuse the same CSS

export default function JockeyTournaments() {
  const [tournaments, setTournaments] = useState(initialTournaments)
  const [loading, setLoading] = useState(true)
  const { searchQuery = '' } = useOutletContext() || {}

  // Filters State
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')

  useEffect(() => {
    fetchTournaments()
  }, [])

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) return 'upcoming'
    if (backendStatus === 'ONGOING') return 'ongoing'
    if (backendStatus === 'COMPLETED') return 'completed'
    if (backendStatus === 'CANCELLED') return 'cancelled'
    if (backendStatus === 'ACTIVE') return 'upcoming'
    return 'upcoming'
  }

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await getAllTournaments()
      if (data && data.length > 0) {
        const formatted = data.map(t => ({
          id: t.id,
          name: t.name,
          venue: t.location,
          startDate: t.startDate,
          endDate: t.endDate,
          races: t.racesCount || 0,
          prize: 'Chưa cập nhật',
          status: mapBackendStatusToFrontend(t.status)
        }))
        setTournaments(formatted)
      } else {
        setTournaments(initialTournaments)
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err)
      setTournaments(initialTournaments)
    } finally {
      setLoading(false)
    }
  }

  const filteredTournaments = tournaments
    .filter(t => {
      const q = localSearch.toLowerCase()
      if (q && !t.name.toLowerCase().includes(q) && !t.venue.toLowerCase().includes(q)) return false
      const gq = searchQuery.toLowerCase()
      if (gq && !t.name.toLowerCase().includes(gq) && !t.venue.toLowerCase().includes(gq)) return false
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') return b.id - a.id
      if (sortOrder === 'OLDEST') return a.id - b.id
      if (sortOrder === 'NAME_AZ') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="tournament-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Danh sách Giải đấu</h1>
          <p className="admin-page-sub">Theo dõi các giải đấu đang và sắp diễn ra</p>
        </div>
      </div>

      <div className="tournament-mgmt-layout">
        <div className="admin-card">
          <div className="admin-filters" style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid rgba(212,175,55,0.15)', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo tên hoặc địa điểm..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="upcoming">Sắp diễn ra</option>
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

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên giải đấu</th>
                  <th>Địa điểm</th>
                  <th>Thời gian</th>
                  <th>Races</th>
                  <th>Giải thưởng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Đang tải danh sách giải đấu...
                    </td>
                  </tr>
                ) : filteredTournaments.length > 0 ? (
                  filteredTournaments.map((t) => (
                    <tr key={t.id}>
                    <td>{t.id}</td>
                    <td><strong className="tournament-name" style={{ color: '#fff' }}>{t.name}</strong></td>
                    <td>{t.venue}</td>
                    <td>{t.startDate} → {t.endDate}</td>
                    <td>{t.races} races</td>
                    <td>{t.prize}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#666' }}>
                      Không có giải đấu nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
