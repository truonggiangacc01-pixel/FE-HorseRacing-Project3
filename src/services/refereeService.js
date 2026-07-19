import apiClient from './apiClient'

export async function updateRefereeProfile(id, payload) {
  const res = await apiClient.put(`/referees/${id}/profile`, payload)
  return res.data
}

export async function updateCertificate(id, payload) {
  const res = await apiClient.put(`/referees/${id}/certificate`, payload)
  return res.data
}

// ==========================================
// Race Operations (UC-18, UC-21 to UC-29)
// ==========================================

export async function inspectRaceParticipants(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/inspection`, payload)
  return res.data
}

export async function submitPreRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/pre-race`, payload)
  return res.data
}

export async function submitPostRaceReport(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/reports/post-race`, payload)
  return res.data
}

export async function recordRaceResult(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/results`, payload)
  return res.data
}

export async function handleRuleViolation(raceId, payload) {
  const res = await apiClient.post(`/races/${raceId}/violations`, payload)
  return res.data
}

export async function getRaceParticipations(raceId) {
  const res = await apiClient.get(`/races/${raceId}/participations`)
  return res.data
}
