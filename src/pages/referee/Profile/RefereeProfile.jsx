import React, { useState, useEffect } from 'react'
import { auth, referee } from '../../../services'
import '../../jockey/Profile/Profile.css'

/* ── Profile View (for existing referee) ── */
function ProfileView() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingLicense, setEditingLicense] = useState(false)
  const [personalErrors, setPersonalErrors] = useState({})
  const [certErrors, setCertErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    phone: '',
    experience: '',
  })

  const [licenseForm, setLicenseForm] = useState({
    licenseNo: '',
    licenseExpiry: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await auth.getMe()
      setProfileData(data)
      setForm({
        name: data.fullName || '',
        nickname: data.userName || '',
        phone: data.phone || '',
        experience: data.experienceYears || ''
      })
      setLicenseForm({
        licenseNo: data.certificateLevel || '',
        licenseExpiry: data.licenseExpiryDate || ''
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSavePersonal(e) {
    e.preventDefault()
    setPersonalErrors({})
    let errs = {}
    if (!form.name || form.name.trim().length < 4) {
      errs.name = "Full name phải có ít nhất 4 ký tự"
    }
    if (!form.phone || !/^0\d{9}$/.test(form.phone)) {
      errs.phone = "sai định dạng số điện thoại"
    }
    if (form.experience && parseInt(form.experience) < 1) {
      errs.experience = "phải có ít nhất 1 năm kinh nghiệm"
    }

    if (Object.keys(errs).length > 0) {
      setPersonalErrors(errs)
      return
    }

    try {
      await referee.updateRefereeProfile(profileData.id, {
        fullName: form.name,
        phone: form.phone,
        birthDate: profileData.birthDate || '1980-01-01', // Fallback nếu DB chưa có
        experienceYears: form.experience ? parseInt(form.experience) : null
      })
      alert('✅ Cập nhật thông tin cá nhân thành công!')
      setEditingPersonal(false)
      loadProfile()
    } catch (err) {
      alert('❌ Lỗi cập nhật: ' + (err.response?.data?.message || err.message))
    }
  }

  async function handleSaveLicense(e) {
    e.preventDefault()
    setCertErrors({})
    let errs = {}
    if (!licenseForm.licenseNo || licenseForm.licenseNo.trim() === '') {
      errs.licenseNo = "Cấp độ chứng chỉ không được để trống"
    }

    if (Object.keys(errs).length > 0) {
      setCertErrors(errs)
      return
    }

    try {
      await referee.updateCertificate(profileData.id, {
        certificateLevel: licenseForm.licenseNo
      })
      alert('✅ Cập nhật chứng chỉ thành công!')
      setEditingLicense(false)
      loadProfile()
    } catch (err) {
      alert('❌ Lỗi cập nhật: ' + (err.response?.data?.message || err.message))
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Đang tải hồ sơ...</div>
  if (!profileData) return <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Không thể tải hồ sơ.</div>

  const isLicenseActive = profileData.accountStatus === 'ACTIVE'
  
  return (
    <div className="profile-view">
      {/* hero card */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {(profileData.fullName || 'R').charAt(0)}
          </div>
          <span className={`jockey-badge ${isLicenseActive ? 'jockey-badge--green' : 'jockey-badge--gray'}`}>
            {isLicenseActive ? '✓ Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{profileData.fullName}</h2>
          <div className="profile-hero-nick">"{profileData.userName}"</div>
          <div className="profile-hero-meta">
            <span>🪪 {profileData.id}</span>
            <span>📋 {profileData.licenseNumber || 'Chưa cập nhật'}</span>
            <span>📅 Sinh ngày {profileData.birthDate || 'N/A'}</span>
          </div>
          <div className="profile-hero-stats">
            <div className="profile-hero-stat">
              <strong>120</strong>
              <span>Trận giám sát</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#d4af37' }}>45</strong>
              <span>Vi phạm đã xử lý</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#00d4aa' }}>4.9</strong>
              <span>Đánh giá</span>
            </div>
            <div className="profile-hero-stat">
              <strong style={{ color: '#c084fc' }}>98%</strong>
              <span>Độ chính xác</span>
            </div>
          </div>
        </div>
      </div>

      {/* details */}
      <div className="profile-detail-grid">
        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Thông tin cá nhân</h3>
            {!editingPersonal && (
              <button
                type="button"
                className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                onClick={() => setEditingPersonal(true)}
              >
                ✎ Sửa
              </button>
            )}
          </div>
          <div className="jockey-card-body">
            {editingPersonal ? (
              <form onSubmit={handleSavePersonal}>
                <div className="jockey-form-grid">
                  <div className="jockey-form-group">
                    <label className="jockey-label">Tên hiển thị</label>
                    <input className="jockey-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                    {personalErrors.name && <span className="profile-err">{personalErrors.name}</span>}
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Biệt danh (Username)</label>
                    <input className="jockey-input" value={form.nickname} disabled style={{opacity: 0.5}} />
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Số điện thoại</label>
                    <input className="jockey-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                    {personalErrors.phone && <span className="profile-err">{personalErrors.phone}</span>}
                  </div>
                  <div className="jockey-form-group">
                    <label className="jockey-label">Năm kinh nghiệm</label>
                    <input className="jockey-input" type="number" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
                    {personalErrors.experience && <span className="profile-err">{personalErrors.experience}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="submit" className="jockey-btn jockey-btn--teal jockey-btn--sm">✓ Lưu thay đổi</button>
                  <button type="button" className="jockey-btn jockey-btn--ghost jockey-btn--sm" onClick={() => setEditingPersonal(false)}>Hủy</button>
                </div>
              </form>
            ) : (
              <>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Họ tên</span><span className="jockey-detail-value">{profileData.fullName}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Biệt danh</span><span className="jockey-detail-value">"{profileData.userName}"</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Email</span><span className="jockey-detail-value">{profileData.email}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Điện thoại</span><span className="jockey-detail-value">{profileData.phone}</span></div>
                <div className="jockey-detail-row"><span className="jockey-detail-label">Kinh nghiệm</span><span className="jockey-detail-value">{profileData.experienceYears || 0} năm</span></div>
              </>
            )}
          </div>
        </div>

        <div className="jockey-card">
          <div className="jockey-card-head">
            <h3>Thông tin chứng chỉ Trọng Tài</h3>
            {!editingLicense && (
              <button
                type="button"
                className="jockey-btn jockey-btn--ghost jockey-btn--sm"
                onClick={() => setEditingLicense(true)}
              >
                ✎ Cập nhật
              </button>
            )}
          </div>
          <div className="jockey-card-body">
            {editingLicense ? (
               <form onSubmit={handleSaveLicense}>
                 <div className="jockey-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                   <div className="jockey-form-group">
                     <label className="jockey-label">Cấp bậc chứng chỉ</label>
                     <input className="jockey-input" value={licenseForm.licenseNo} onChange={(e) => setLicenseForm({...licenseForm, licenseNo: e.target.value})} />
                     {certErrors.licenseNo && <span className="profile-err">{certErrors.licenseNo}</span>}
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                   <button type="submit" className="jockey-btn jockey-btn--teal jockey-btn--sm">✓ Lưu chứng chỉ</button>
                   <button type="button" className="jockey-btn jockey-btn--ghost jockey-btn--sm" onClick={() => setEditingLicense(false)}>Hủy</button>
                 </div>
               </form>
            ) : (
              <>
                <div className="profile-license-badge">
                  <span className="plb-icon">🪪</span>
                  <div>
                    <div className="plb-number">{profileData.certificateLevel || 'N/A'}</div>
                    <div className="plb-sub">Chứng chỉ Trọng Tài</div>
                  </div>
                  <span className="jockey-badge jockey-badge--green">Còn hiệu lực</span>
                </div>
                <div className="jockey-detail-row">
                  <span className="jockey-detail-label">Cấp độ chứng chỉ</span>
                  <span className="jockey-detail-value">{profileData.certificateLevel || 'N/A'}</span>
                </div>
                <div className="jockey-detail-row">
                  <span className="jockey-detail-label">Mã tài khoản</span>
                  <span className="jockey-detail-value">{profileData.id}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function RefereeProfile() {
  return (
    <div>
      <div className="jockey-page-head">
        <div>
          <h1 className="jockey-page-title">Hồ sơ Trọng Tài</h1>
          <p className="jockey-page-sub">
            Quản lý thông tin hồ sơ cá nhân và chứng chỉ hành nghề
          </p>
        </div>
      </div>
      <ProfileView />
    </div>
  )
}
