import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../api';

const AppContext = createContext(null);

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function AppProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [businesses, setBusinesses]         = useState([]);
  const [currentBusinessId, _setCurrentBiz] = useState(null);
  const [cashbooks, setCashbooks]           = useState([]);
  const [loadingBiz, setLoadingBiz]         = useState(false);
  const [loadingBooks, setLoadingBooks]     = useState(false);

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId) || null;

  // ── Load businesses ──────────────────────────────────────
  const loadBusinesses = useCallback(async () => {
    setLoadingBiz(true);
    try {
      const data = await api.getBusinesses();
      const list = data.businesses || [];
      setBusinesses(list);
      if (list.length && !currentBusinessId) {
        _setCurrentBiz(list[0].id);
      }
    } catch (err) {
      console.warn('[AppContext] loadBusinesses:', err.message);
    } finally {
      setLoadingBiz(false);
    }
  }, [currentBusinessId]);

  // ── Load cashbooks when business changes ─────────────────
  const loadCashbooks = useCallback(async (bizId) => {
    if (!bizId) return;
    setLoadingBooks(true);
    try {
      const data = await api.getCashbooks(bizId);
      setCashbooks(data.cashbooks || []);
    } catch (err) {
      console.warn('[AppContext] loadCashbooks:', err.message);
      setCashbooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadBusinesses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentBusinessId) loadCashbooks(currentBusinessId);
  }, [currentBusinessId]);

  const setCurrentBusinessId = (id) => {
    _setCurrentBiz(id);
    setCashbooks([]);
  };

  // ── Business actions ──────────────────────────────────────
  const addBusiness = async (name, category, businessType) => {
    const data = await api.createBusiness({ name, category, businessType });
    await loadBusinesses();
    return data.business?.id;
  };

  // ── Cashbook actions ──────────────────────────────────────
  const addCashbook = async (name) => {
    await api.createCashbook(currentBusinessId, { name });
    await loadCashbooks(currentBusinessId);
  };

  const renameCashbook = async (bookId, name) => {
    await api.renameCashbook(currentBusinessId, bookId, { name });
    await loadCashbooks(currentBusinessId);
  };

  const deleteCashbook = async (bookId) => {
    await api.deleteCashbook(currentBusinessId, bookId);
    setCashbooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const userProfile = user
    ? { ...user, initials: initials(user.name || user.email || user.mobile) }
    : null;

  return (
    <AppContext.Provider value={{
      businesses, currentBusiness, currentBusinessId,
      cashbooks, loadingBiz, loadingBooks,
      setCurrentBusinessId,
      addBusiness, loadBusinesses,
      addCashbook, renameCashbook, deleteCashbook,
      loadCashbooks,
      user: userProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
