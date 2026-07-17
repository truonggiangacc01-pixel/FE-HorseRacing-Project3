import React, { useState } from 'react'
import { referees as initialReferees, raceAssignments as initialAssignments } from '../../../data/adminMockData'
import { StatusBadge } from '../../../utils/adminHelpers'
import './RefereeAssignment.css'

export default function RefereeAssignment() {
  const [referees, setReferees] = useState(initialReferees)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [assigningRaceId, setAssigningRaceId] = useState(null)

  /**
   * Check schedule conflict: a referee must not be assigned to two races
   * that share the same date AND the same time slot.
   *
   * @param {string} refId - referee ID being assigned
   * @param {string} targetRaceId - race being assigned to
   * @returns {{ hasConflict: boolean, conflictingRace: object|null }}
   */
  const checkScheduleConflict = (refId, targetRaceId) => {
    const selectedRef = referees.find(r => String(r.id) === String(refId))
    if (!selectedRef) return { hasConflict: false, conflictingRace: null }

    // Get the target race's date/time from assignments
    const targetAssignment = assignments.find(a => a.raceId === targetRaceId)
    if (!targetAssignment || !targetAssignment.date || !targetAssignment.time) {
      return { hasConflict: false, conflictingRace: null }
    }

    // Find other races already assigned to this referee (excluding the target race itself)
    const otherAssignedRaceIds = selectedRef.assignedRaces.filter(id => id !== targetRaceId)

    for (const existingRaceId of otherAssignedRaceIds) {
      const existingAssignment = assignments.find(a => a.raceId === existingRaceId)
      if (!existingAssignment) continue

      // Same date AND same time → hard conflict, block assignment
      if (
        existingAssignment.date === targetAssignment.date &&
        existingAssignment.time === targetAssignment.time
      ) {
        return { hasConflict: true, conflictingRace: existingAssignment, type: 'same_slot' }
      }

      // Same date but different time → soft warning (still allowed but user is informed)
      if (existingAssignment.date === targetAssignment.date) {
        return { hasConflict: true, conflictingRace: existingAssignment, type: 'same_day' }
      }
    }

    return { hasConflict: false, conflictingRace: null }
  }

  const handleAssignReferee = (raceId, refereeId) => {
    // Handle "Bỏ phân công": value is empty string OR sentinel 'unassign'
    if (!refereeId || refereeId === 'unassign') {
      setAssignments(prev => prev.map(a =>
        a.raceId === raceId
          ? { ...a, referee: null, status: 'unassigned', conflict: false }
          : a
      ))
      setReferees(prev => prev.map(r => ({
        ...r,
        assignedRaces: r.assignedRaces.filter(id => id !== raceId)
      })))
      setAssigningRaceId(null)
      return
    }

    const selectedRef = referees.find(r => String(r.id) === String(refereeId))
    if (!selectedRef) return

    // ── 1. Static interest conflict (existing flag) ──────────────────────────
    const hasInterestConflict = selectedRef.conflict

    // ── 2. Schedule conflict check ───────────────────────────────────────────
    const { hasConflict: hasScheduleConflict, conflictingRace, type: conflictType } =
      checkScheduleConflict(refereeId, raceId)

    // BLOCK: same date + same time (hard rule — 1 referee per time slot)
    if (hasScheduleConflict && conflictType === 'same_slot') {
      alert(
        `🚫 Không thể phân công!\n\n` +
        `Trọng tài ${selectedRef.name} đã được gán cho race "${conflictingRace.raceName}" ` +
        `vào cùng khung giờ ${conflictingRace.time} ngày ${conflictingRace.date}.\n\n` +
        `Một trọng tài chỉ có thể giám sát 1 race trong cùng khung giờ.`
      )
      return  // Hard block — do NOT proceed
    }

    // WARN: same date but different time (soft rule — inform admin)
    if (hasScheduleConflict && conflictType === 'same_day') {
      const confirmed = window.confirm(
        `⚠️ Cảnh báo lịch!\n\n` +
        `Trọng tài ${selectedRef.name} đã có race "${conflictingRace.raceName}" ` +
        `vào lúc ${conflictingRace.time} ngày ${conflictingRace.date}.\n\n` +
        `Bạn vẫn muốn gán thêm race trong cùng ngày không?`
      )
      if (!confirmed) return  // Admin chose to cancel
    }

    // ── 3. Update assignment record ──────────────────────────────────────────
    const targetAssignment = assignments.find(a => a.raceId === raceId)
    const isScheduleWarn = hasScheduleConflict && conflictType === 'same_day'
    const isConflict = hasInterestConflict || isScheduleWarn

    setAssignments(prev => prev.map(a => {
      if (a.raceId === raceId) {
        return {
          ...a,
          referee: selectedRef.name,
          status: isConflict ? 'conflict' : 'assigned',
          conflict: isConflict,
          scheduleWarn: isScheduleWarn,
        }
      }
      return a
    }))

    // ── 4. Update referee's assignedRaces ────────────────────────────────────
    setReferees(prev => prev.map(r => {
      if (String(r.id) === String(selectedRef.id)) {
        return { ...r, assignedRaces: Array.from(new Set([...r.assignedRaces, raceId])) }
      }
      return { ...r, assignedRaces: r.assignedRaces.filter(id => id !== raceId) }
    }))

    setAssigningRaceId(null)

    // ── 5. Success / warning notification ───────────────────────────────────
    if (hasInterestConflict && isScheduleWarn) {
      alert(
        `⚠️ Đã phân công với 2 cảnh báo:\n` +
        `• Trọng tài có xung đột lợi ích với race này\n` +
        `• Trọng tài đã có race khác trong cùng ngày`
      )
    } else if (hasInterestConflict) {
      alert(`⚠️ Cảnh báo: Trọng tài ${selectedRef.name} có xung đột lợi ích với cuộc đua này! Hệ thống đã gắn cờ cảnh báo.`)
    } else if (isScheduleWarn) {
      alert(`⚠️ Đã phân công. Lưu ý: trọng tài có race khác trong cùng ngày.`)
    } else {
      alert(`✅ Đã phân công Trọng tài ${selectedRef.name} thành công!`)
    }
  }

  return (
    <div className="referee-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Phân công Trọng tài</h1>
          <p className="admin-page-sub">Quản lý danh sách trọng tài giám sát, kiểm tra xung đột lợi ích stables</p>
        </div>
      </div>

      <div className="referee-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* ── Left: Referee list ── */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Danh sách trọng tài</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ tên</th>
                  <th>Giấy phép</th>
                  <th>Kinh nghiệm</th>
                  <th>Race đã gán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong style={{ color: '#fff' }}>{r.name}</strong></td>
                    <td>{r.license}</td>
                    <td>{r.experience}</td>
                    <td>
                      <span style={{ fontSize: '11px', color: r.assignedRaces.length > 0 ? '#d4af37' : '#555' }}>
                        {r.assignedRaces.length > 0 ? r.assignedRaces.join(', ') : '—'}
                      </span>
                    </td>
                    <td>
                      {r.conflict
                        ? <span className="admin-badge admin-badge--red">Xung đột</span>
                        : <span className="admin-badge admin-badge--green">Sẵn sàng</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Assignment list ── */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Phân công theo Race</h3>
          </div>
          <div className="admin-card-body referee-assign-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map((a) => (
              <div
                key={a.raceId}
                className={`referee-assign-item${a.conflict ? ' referee-assign-item--conflict' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: a.conflict ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: a.conflict ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Race info */}
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>{a.raceName}</strong>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    {a.raceId}
                    {a.date && a.time && (
                      <span style={{ marginLeft: '8px', color: '#888' }}>
                        📅 {a.date} · ⏰ {a.time}
                      </span>
                    )}
                  </span>
                </div>

                {/* Assigned referee */}
                <div className="referee-assign-ref" style={{ flex: 1, textAlign: 'center', fontWeight: '500', color: a.referee ? '#fff' : '#666' }}>
                  👤 {a.referee || 'Chưa phân công'}
                  {a.scheduleWarn && (
                    <span title="Trọng tài có race khác trong cùng ngày" style={{ marginLeft: '6px', color: '#f59e0b', fontSize: '12px' }}>⚠️</span>
                  )}
                </div>

                {/* Status badge */}
                <div style={{ marginRight: '16px' }}>
                  <StatusBadge status={a.status === 'conflict' ? 'conflict' : a.status === 'assigned' ? 'assigned' : 'unassigned'} />
                </div>

                {/* Action: dropdown or button */}
                {assigningRaceId === a.raceId ? (
                  <select
                    className="admin-select"
                    onChange={(e) => handleAssignReferee(a.raceId, e.target.value)}
                    defaultValue=""
                    style={{ minWidth: '160px', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="" disabled>-- Chọn Trọng tài --</option>
                    <option value="unassign">🚫 Bỏ phân công</option>
                    {referees.map(r => {
                      // Pre-compute warnings to display in dropdown
                      const { hasConflict, conflictingRace, type } = checkScheduleConflict(r.id, a.raceId)
                      const sameSlot = hasConflict && type === 'same_slot'
                      const sameDay  = hasConflict && type === 'same_day'
                      const label = [
                        r.name,
                        r.conflict ? '⚡Xung đột lợi ích' : null,
                        sameSlot   ? '🚫 Trùng khung giờ' : null,
                        sameDay    ? '⚠️ Cùng ngày'       : null,
                      ].filter(Boolean).join(' · ')
                      return (
                        <option key={r.id} value={r.id} disabled={sameSlot}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    onClick={() => setAssigningRaceId(a.raceId)}
                  >
                    {a.referee ? 'Đổi TT' : 'Phân công'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
