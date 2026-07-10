import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web → localhost, Android emulator → 10.0.2.2, Production → Render
const BASE = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:3001/api'
    : 'http://10.0.2.2:3001/api'
  : 'https://cashbook-backend-eyji.onrender.com/api';

const TOKEN_KEY = 'cashbook_token';

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeStoredToken() {
  return AsyncStorage.removeItem(TOKEN_KEY);
}

async function saveTokenFromHeader(headers) {
  const raw = headers.get('set-cookie') || headers.get('Set-Cookie');
  if (!raw) return;
  const match = raw.match(/cashbook_token=([^;]+)/);
  if (match) await AsyncStorage.setItem(TOKEN_KEY, match[1]);
}

const isWeb = Platform.OS === 'web';

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };

  if (isWeb) {
    // Web: browser handles cookies automatically via credentials:'include'
    // Do NOT set Cookie header manually — browser security blocks Set-Cookie reads
  } else {
    // Native (Android/iOS): manually attach stored JWT as Cookie header
    const token = await getStoredToken();
    if (token) headers['Cookie'] = `cashbook_token=${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: isWeb ? 'include' : 'omit',
    body: body !== undefined ? JSON.stringify(body) : undefined });

  if (!isWeb) {
    // Native only: extract and store token from Set-Cookie header
    await saveTokenFromHeader(res.headers);
  }

  if (res.status === 401) {
    if (!isWeb) await removeStoredToken();
    throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = {}; }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

const get  = (path)       => request('GET',    path);
const post = (path, body) => request('POST',   path, body);
const patch= (path, body) => request('PATCH',  path, body);
const del  = (path)       => request('DELETE', path);

// ── Auth ──────────────────────────────────────────────────
export const sendOtp       = (data)            => post('/auth/send-otp', data);
export const verifyOtp     = (data)            => post('/auth/verify-otp', data);
export const getMe         = ()                => get('/auth/me');
export const updateMe      = (data)            => patch('/auth/me', data);
export const logout        = ()                => post('/auth/logout').finally(removeStoredToken);

// ── Businesses ────────────────────────────────────────────
export const getBusinesses    = ()             => get('/businesses');
export const createBusiness   = (data)         => post('/businesses', data);
export const updateBusiness   = (id, data)     => patch(`/businesses/${id}`, data);
export const deleteBusiness   = (id)           => del(`/businesses/${id}`);
export const uploadBusinessLogo = async (id, fileAsset) => {
  const formData = new FormData();
  
  if (isWeb) {
    // On web, we must fetch the blob from the data URI or blob URL
    const response = await fetch(fileAsset.uri);
    const blob = await response.blob();
    formData.append('logo', blob, 'logo.jpg');
  } else {
    // On native, we use the special object format for React Native FormData
    formData.append('logo', {
      uri: fileAsset.uri,
      type: 'image/jpeg',
      name: fileAsset.uri.split('/').pop() || 'logo.jpg'
    });
  }
  
  const headers = {};
  // DO NOT set 'Content-Type': 'multipart/form-data' explicitly on Web!
  // The browser needs to set it automatically with the correct boundary.
  if (!isWeb) {
    headers['Content-Type'] = 'multipart/form-data';
  }
  
  const config = {
    method: 'POST',
    headers,
    body: formData
  };

  if (isWeb) {
    config.credentials = 'include';
  } else {
    const token = await getStoredToken();
    if (token) config.headers['Cookie'] = `cashbook_token=${token}`;
  }
  
  const res = await fetch(`${BASE}/businesses/${id}/upload-logo`, config);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

// ── Cashbooks ─────────────────────────────────────────────
export const getCashbooks     = (biz)          => get(`/businesses/${biz}/cashbooks`);
export const createCashbook   = (biz, data)    => post(`/businesses/${biz}/cashbooks`, data);
export const renameCashbook   = (biz, bk, d)   => patch(`/businesses/${biz}/cashbooks/${bk}`, d);
export const deleteCashbook   = (biz, bk)      => del(`/businesses/${biz}/cashbooks/${bk}`);

// ── Transactions ──────────────────────────────────────────
export const getTransactions  = (biz, bk)      => get(`/businesses/${biz}/cashbooks/${bk}/transactions`);
export const addTransaction   = (biz, bk, d)   => post(`/businesses/${biz}/cashbooks/${bk}/transactions`, d);
export const updateTransaction= (biz, bk, t, d)=> patch(`/businesses/${biz}/cashbooks/${bk}/transactions/${t}`, d);
export const deleteTransaction= (biz, bk, t)   => del(`/businesses/${biz}/cashbooks/${bk}/transactions/${t}`);

// ── Parties ───────────────────────────────────────────────
export const getParties       = (biz, bk)      => get(`/businesses/${biz}/cashbooks/${bk}/parties`);
export const createParty      = (biz, bk, d)   => post(`/businesses/${biz}/cashbooks/${bk}/parties`, d);

// ── Book Members ──────────────────────────────────────────
export const getBookMembers   = (biz, bk)      => get(`/businesses/${biz}/cashbooks/${bk}/members`);
export const addBookMember    = (biz, bk, d)   => post(`/businesses/${biz}/cashbooks/${bk}/members`, d);
export const updateBookMember = (biz, bk, m, d)=> patch(`/businesses/${biz}/cashbooks/${bk}/members/${m}`, d);
export const removeBookMember = (biz, bk, m)   => del(`/businesses/${biz}/cashbooks/${bk}/members/${m}`);

// ── Business Team ─────────────────────────────────────────
export const getTeam          = (biz)          => get(`/businesses/${biz}/team`);
export const addTeamMember    = (biz, d)       => post(`/businesses/${biz}/team`, d);
export const updateTeamMember = (biz, m, d)    => patch(`/businesses/${biz}/team/${m}`, d);
export const removeTeamMember = (biz, m)       => del(`/businesses/${biz}/team/${m}`);
export const getMemberBooks   = (biz, m)       => get(`/businesses/${biz}/team/${m}/books`);
export const assignMemberBook = (biz, m, d)    => post(`/businesses/${biz}/team/${m}/books`, d);
export const updateMemberBook = (biz, m, bk, d)=> patch(`/businesses/${biz}/team/${m}/books/${bk}`, d);
export const removeMemberBook = (biz, m, bk)   => del(`/businesses/${biz}/team/${m}/books/${bk}`);

// ── Users ─────────────────────────────────────────────────
export const lookupUser       = (email)  => get(`/users/lookup?email=${encodeURIComponent(email)}`);
export const lookupUserMobile = (mobile) => get(`/users/lookup?mobile=${encodeURIComponent(mobile)}`);

// ── Invitations ───────────────────────────────────────────
export const getPendingInvitations = (bizId, bookId)       => get(`/businesses/${bizId}/cashbooks/${bookId}/invitations`);
export const createBookInvitation  = (bizId, bookId, data) => post(`/businesses/${bizId}/cashbooks/${bookId}/invitations`, data);
export const acceptInvitation      = (token)               => post(`/invitations/${token}/accept`);
