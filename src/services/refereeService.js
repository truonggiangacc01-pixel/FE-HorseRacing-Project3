import apiClient from './apiClient'

export async function updateRefereeProfile(id, payload) {
  const res = await apiClient.put(`/referees/${id}/profile`, payload)
  return res.data
}

export async function updateCertificate(id, payload) {
  const res = await apiClient.put(`/referees/${id}/certificate`, payload)
  return res.data
}
