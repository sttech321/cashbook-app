import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, StyleSheet, Alert, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getTransactions } from '../api';
import { colors, typography, radius, spacing } from '../theme';

const FALLBACK_SUGGESTIONS = ['home expenses', 'personal cash', 'shopping shared', 'shopping collection'];

const SORT_OPTIONS = [
  { key: 'lastUpdated', label: 'Last Updated' },
  { key: 'nameAZ',      label: 'Name (A to Z)' },
  { key: 'balanceHigh', label: 'Net Balance (High to Low)' },
  { key: 'balanceLow',  label: 'Net Balance (Low to High)' },
  { key: 'lastCreated', label: 'Last Created' },
];

function SortModal({ visible, current, onApply, onClose }) {
  const [selected, setSelected] = React.useState(current);

  React.useEffect(() => { if (visible) setSelected(current); }, [visible, current]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.sortHeader}>
            <TouchableOpacity onPress={onClose} style={s.sortCloseBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.sortTitle}>Sort Books By</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={s.sortDivider} />

          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[s.sortOption, selected === opt.key && s.sortOptionActive]}
              onPress={() => setSelected(opt.key)}
            >
              <View style={[s.radioOuter, selected === opt.key && s.radioOuterActive]}>
                {selected === opt.key && <View style={s.radioInner} />}
              </View>
              <Text style={[s.sortOptionText, selected === opt.key && s.sortOptionTextBold]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={s.sortDivider} />

          <TouchableOpacity
            style={[s.sortApplyBtn, selected !== current && s.sortApplyBtnActive]}
            onPress={() => { onApply(selected); onClose(); }}
          >
            <Text style={[s.sortApplyText, selected !== current && s.sortApplyTextActive]}>
              APPLY
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// createdAt — when the book was made; updatedAt — last transaction/edit
// Show "Created" if never touched after creation, else "Updated"
function formatBookDate(createdAt, updatedAt) {
  const hasUpdates = updatedAt && updatedAt !== createdAt;
  const prefix = hasUpdates ? 'Updated' : 'Created';
  const iso = hasUpdates ? updatedAt : createdAt;
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs  = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return `${prefix} just now`;
  if (diffHr  < 1)  return `${prefix} ${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffDay < 1)  return `${prefix} ${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7)  return `${prefix} ${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${prefix} on ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function formatBalance(val) {
  const n = Number(val ?? 0);
  if (n === 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function AddBookModal({ visible, onClose, onAdd, suggestName }) {
  const [name, setName] = useState(suggestName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setName(suggestName || ''); }, [visible, suggestName]);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onAdd(name.trim()); setName(''); onClose(); }
    catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Add New Book</Text>
          <Text style={s.modalLabel}>Book Name</Text>
          <TextInput
            style={s.modalInput}
            placeholder="Enter book name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={submit}
          />
          <TouchableOpacity
            style={[s.modalBtn, (!name.trim() || saving) && s.btnDisabled]}
            onPress={submit}
            disabled={!name.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.modalBtnText}>Create Book</Text>
            }
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function BusinessSwitcher({ visible, onClose, onAddNew }) {
  const { businesses, currentBusinessId, setCurrentBusinessId, cashbooks } = useApp();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.bizSheetHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.bizSheetTitle}>Select Business</Text>
            <View style={{ width: 22 }} />
          </View>

          {businesses.map((b) => {
            const bookCount = b.id === currentBusinessId ? cashbooks.length : (b.bookCount || 0);
            return (
              <TouchableOpacity
                key={b.id}
                style={s.bizItem}
                onPress={() => { setCurrentBusinessId(b.id); onClose(); }}
              >
                <View style={s.bizGridIcon}>
                  <Ionicons name="grid" size={18} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bizItemName}>{b.name}</Text>
                  <Text style={s.bizItemSub}>Your Role: Primary Admin · {bookCount} {bookCount === 1 ? 'Book' : 'Books'}</Text>
                </View>
                {b.id === currentBusinessId && (
                  <View style={s.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={s.addBizBtn} onPress={() => { onClose(); onAddNew(); }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.addBizBtnText}>+ ADD NEW BUSINESS</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function DeleteModal({ visible, book, onClose, onDelete }) {
  const [typed, setTyped]     = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (visible) setTyped(''); }, [visible]);

  const matches   = typed.trim() === book?.name?.trim();
  const canDelete = matches && !deleting;

  const doDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try { await onDelete(book.id); onClose(); }
    catch (err) { Alert.alert('Error', err.message); }
    finally { setDeleting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle} />
          {/* Header row */}
          <View style={s.deleteHeader}>
            <TouchableOpacity onPress={onClose} style={s.deleteCloseBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.deleteTitle} numberOfLines={1}>
              Delete {book?.name} ?
            </Text>
          </View>
          <View style={s.deleteHDivider} />

          {/* Warning banner */}
          <View style={s.warnBanner}>
            <View style={s.warnIcon}>
              <Ionicons name="information-circle" size={20} color={colors.red} />
            </View>
            <Text style={s.warnText}>
              Are you sure? You will lose all entries of this book permanently
            </Text>
          </View>

          {/* Confirm text */}
          <Text style={s.confirmText}>
            Please type <Text style={{ fontFamily: 'Poppins-Medium' }}>{book?.name}</Text> to confirm
          </Text>

          {/* Floating-label input */}
          <View style={[s.deleteInputWrap, typed.length > 0 && s.deleteInputWrapActive]}>
            <Text style={s.deleteInputLabel}>Book Name</Text>
            <TextInput
              style={s.deleteInput}
              value={typed}
              onChangeText={setTyped}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={doDelete}
            />
          </View>

          {/* Delete button */}
          <TouchableOpacity
            style={[s.deleteBtn, canDelete && s.deleteBtnActive]}
            onPress={doDelete}
            disabled={!canDelete}
          >
            {deleting
              ? <ActivityIndicator color={canDelete ? '#fff' : colors.gray400} size="small" />
              : <Text style={[s.deleteBtnText, canDelete && s.deleteBtnTextActive]}>DELETE</Text>
            }
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function RenameModal({ visible, book, onClose, onRename }) {
  const [name, setName]     = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setName(book?.name || ''); }, [visible, book]);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onRename(book.id, name.trim()); onClose(); }
    catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Rename Book</Text>
          <TextInput
            style={s.modalInput}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={submit}
          />
          <TouchableOpacity style={[s.modalBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalBtnText}>Save</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function CashbooksListScreen({ navigation }) {
  const {
    cashbooks, businesses, currentBusiness, addCashbook, deleteCashbook,
    renameCashbook, loadingBiz, loadingBooks, loadCashbooks, currentBusinessId } = useApp();

  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [showBiz, setShowBiz]       = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [menuBook, setMenuBook]     = useState(null);
  const [menuY, setMenuY]           = useState(0);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSort, setShowSort]     = useState(false);
  const [sortBy, setSortBy]         = useState('lastUpdated');
  const [suggestName, setSuggestName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bookBalances, setBookBalances] = useState({});

  // ── Scroll-aware FAB animation ──
  const fabAnim      = useRef(new Animated.Value(1)).current; // 1=expanded, 0=collapsed
  const lastScrollY  = useRef(0);
  const fabExpanded  = useRef(true);

  const animateFab = useCallback((expand) => {
    if (fabExpanded.current === expand) return;
    fabExpanded.current = expand;
    Animated.spring(fabAnim, {
      toValue: expand ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 9 }).start();
  }, [fabAnim]);

  const handleScroll = useCallback((e) => {
    const y  = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    if (dy > 4)       animateFab(true);   // scroll down → expand
    else if (dy < -4) animateFab(false);  // scroll up   → collapse
    lastScrollY.current = y;
  }, [animateFab]);

  const fabWidth        = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [48, 168] });
  const fabTextOpacity  = fabAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const fabTextMaxWidth = fabAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 120] });

  // Generate suggestion chips dynamically from existing book names
  const bookSuggestions = useMemo(() => {
    const SUFFIXES = ['shared', 'staff', 'team', 'personal', 'expenses'];
    const existing = new Set(cashbooks.map(b => b.name.toLowerCase().trim()));
    const suggestions = [];

    for (const book of cashbooks) {
      if (suggestions.length >= 4) break;
      // Append suffixes that don't already exist
      for (const suffix of SUFFIXES) {
        if (suggestions.length >= 4) break;
        if (book.name.toLowerCase().endsWith(suffix)) continue;
        const name = `${book.name} ${suffix}`;
        if (!existing.has(name.toLowerCase())) {
          suggestions.push(name);
          existing.add(name.toLowerCase());
        }
      }
      // Increment trailing number (e.g. "cp67" → "cp68", "cp69")
      const numMatch = book.name.match(/^(.*?)(\d+)$/);
      if (numMatch) {
        const base = numMatch[1], num = parseInt(numMatch[2]);
        for (let i = 1; i <= 3 && suggestions.length < 4; i++) {
          const name = `${base}${num + i}`;
          if (!existing.has(name.toLowerCase())) {
            suggestions.push(name);
            existing.add(name.toLowerCase());
          }
        }
      }
    }
    // Fill remaining with fallbacks
    for (const name of FALLBACK_SUGGESTIONS) {
      if (suggestions.length >= 4) break;
      if (!existing.has(name.toLowerCase())) suggestions.push(name);
    }
    return suggestions.slice(0, 4);
  }, [cashbooks]);

  // Only redirect to Onboarding on initial load (loadingBiz just finished for the first time)
  // Removed automatic redirect to allow empty state to render.

  // Compute net balance for each book — runs on mount and every time screen is focused
  const currentBizRef = useRef(currentBusinessId);
  currentBizRef.current = currentBusinessId;

  useFocusEffect(
    useCallback(() => {
      const bizId = currentBizRef.current;
      if (!bizId || cashbooks.length === 0) return;
      let cancelled = false;

      Promise.all(
        cashbooks.map(async (book) => {
          try {
            const data = await getTransactions(bizId, book.id);
            const txns = data.transactions || [];
            const totalIn  = txns.filter(t => t.type === 'IN') .reduce((s, t) => s + Number(t.amount || 0), 0);
            const totalOut = txns.filter(t => t.type === 'OUT').reduce((s, t) => s + Number(t.amount || 0), 0);
            return [book.id, totalIn - totalOut];
          } catch {
            return [book.id, null];
          }
        })
      ).then(results => {
        if (cancelled) return;
        const map = {};
        results.forEach(([id, val]) => { if (val !== null) map[id] = val; });
        setBookBalances(map);
      });

      return () => { cancelled = true; };
    }, [cashbooks])
  );

  const filtered = useMemo(() => {
    const base = cashbooks.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()));
    switch (sortBy) {
      case 'nameAZ':
        return [...base].sort((a, b) => a.name.localeCompare(b.name));
      case 'balanceHigh':
        return [...base].sort((a, b) => (bookBalances[b.id] ?? Number(b.balance ?? 0)) - (bookBalances[a.id] ?? Number(a.balance ?? 0)));
      case 'balanceLow':
        return [...base].sort((a, b) => (bookBalances[a.id] ?? Number(a.balance ?? 0)) - (bookBalances[b.id] ?? Number(b.balance ?? 0)));
      case 'lastCreated':
        return [...base].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'lastUpdated':
      default:
        return [...base].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    }
  }, [cashbooks, search, sortBy, bookBalances]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadCashbooks(currentBusinessId); } finally { setRefreshing(false); }
  }, [currentBusinessId]);

  const openSuggest = (name) => {
    setSuggestName(name);
    setShowAdd(true);
  };

  const renderBook = ({ item, index }) => {
    const netBalance = bookBalances[item.id] ?? Number(item.balance ?? 0);
    const hasBalance = item.id in bookBalances;

    return (
      <TouchableOpacity
        style={[s.bookCard, index > 0 && s.bookCardBorder]}
        onPress={() => navigation.navigate('TransactionView', { bookId: item.id, bookName: item.name })}
      >
        <View style={s.bookIcon}>
          <Ionicons name="bookmark" size={24} color="#4F60F0" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bookName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            {item.memberCount > 1 && (
              <Text style={s.bookMeta}>{item.memberCount} Members · </Text>
            )}
            <Text style={s.bookMeta}>{formatBookDate(item.created_at, item.updated_at)}</Text>
          </View>
        </View>
        <View style={s.bookRight}>
          {hasBalance ? (
            <Text style={[s.bookBalance, { color: netBalance < 0 ? colors.red : colors.green }]}>
              {formatBalance(netBalance)}
            </Text>
          ) : (
            <ActivityIndicator size="small" color={colors.gray300} style={{ marginRight: 4 }} />
          )}
          <TouchableOpacity
            style={s.moreBtn}
            onPress={(e) => {
              setMenuBook(item);
              setMenuY(e.nativeEvent.pageY);
              setShowMenu(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.gray400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  if (!loadingBiz && businesses.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.noBizContainer}>
          <View style={s.noBizIconCircle}>
            <Ionicons name="business" size={36} color={colors.blue} />
            <Ionicons name="add" size={14} color={colors.blue} style={s.noBizIconAdd} />
          </View>
          <Text style={s.noBizTitle}>Add business to get started</Text>
          <Text style={s.noBizSubtitle}>You don't have any business profiles</Text>
          <TouchableOpacity style={s.noBizBtn} onPress={() => navigation.navigate('Onboarding')}>
            <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 4 }} />
            <Text style={s.noBizBtnText}>ADD BUSINESS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.bizSwitcher} onPress={() => setShowBiz(true)}>
          <View style={s.bizIconBox}>
            <Ionicons name="grid" size={16} color={colors.gray500} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.bizName} numberOfLines={1}>{currentBusiness?.name || 'Select Business'}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.gray400} />
            </View>
            <Text style={s.bizSubLabel}>Tap to switch business</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.addPersonBtn} onPress={() => navigation.navigate('Team')}>
          <Ionicons name="person-add-outline" size={22} color={colors.blue} />
        </TouchableOpacity>
      </View>

      {/* Your Books header row */}
      <View style={s.booksHeader}>
        <Text style={s.booksTitle}>Your Books</Text>
        <View style={s.booksHeaderRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setShowSort(true)}>
            <Ionicons name="swap-vertical-outline" size={24} color={colors.blue} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('BookSearch', { bookBalances })}>
            <Ionicons name="search-outline" size={24} color={colors.blue} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar (shown when search icon tapped) */}
      {showSearch && (
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.gray400} />
          <TextInput
            style={s.searchInput}
            placeholder="Search books..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loadingBooks ? (
        <View style={s.center}><ActivityIndicator color={colors.blue} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          contentContainerStyle={s.list}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          ListEmptyComponent={
            !search ? null : (
              <View style={s.emptySearch}>
                <Text style={s.emptySearchText}>No books found for "{search}"</Text>
              </View>
            )
          }
          ListFooterComponent={
            cashbooks.length > 0 ? (
              <>
                <View style={s.bookListBottom} />
                <View style={s.addNewCard}>
                  <View style={s.addNewCardLeft}>
                    <Text style={s.addNewCardTitle}>Add New Book</Text>
                    <Text style={s.addNewCardSub}>Click to quickly add books for</Text>
                    <View style={s.suggestChips}>
                      {[[0,1],[2,3]].map((pair, ri) => (
                        <View key={ri} style={s.suggestRow}>
                          {pair.map(i => bookSuggestions[i] ? (
                            <TouchableOpacity
                              key={bookSuggestions[i]}
                              style={s.suggestChip}
                              onPress={() => openSuggest(bookSuggestions[i])}
                            >
                              <Text style={s.suggestChipText} numberOfLines={1}>{bookSuggestions[i]}</Text>
                            </TouchableOpacity>
                          ) : <View key={i} style={{ flex: 1 }} />)}
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={s.addNewCardIcon}>
                    <Ionicons name="library" size={30} color={colors.blue} />
                  </View>
                </View>
              </>
            ) : (
              <View style={s.emptyState}>
                <Ionicons name="book-outline" size={60} color={colors.gray200} />
                <Text style={s.emptyTitle}>No cashbooks yet</Text>
                <Text style={s.emptySub}>Tap "+ Add New Book" to get started</Text>
              </View>
            )
          }
        />
      )}

      {/* FAB — scroll-aware: expands on scroll-down, collapses to icon on scroll-up */}
      <Animated.View style={[s.fabWrap, { width: fabWidth }]}>
        <TouchableOpacity style={s.fab} onPress={() => { setSuggestName(''); setShowAdd(true); }} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
          <Animated.Text
            style={[s.fabText, { opacity: fabTextOpacity, maxWidth: fabTextMaxWidth }]}
            numberOfLines={1}
          >
            ADD NEW BOOK
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      <AddBookModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addCashbook}
        suggestName={suggestName}
      />
      <BusinessSwitcher
        visible={showBiz}
        onClose={() => setShowBiz(false)}
        onAddNew={() => navigation.navigate('AddBusiness')}
      />
      <SortModal
        visible={showSort}
        current={sortBy}
        onApply={setSortBy}
        onClose={() => setShowSort(false)}
      />
      <RenameModal
        visible={showRename}
        book={menuBook}
        onClose={() => setShowRename(false)}
        onRename={renameCashbook}
      />
      <DeleteModal
        visible={showDelete}
        book={menuBook}
        onClose={() => setShowDelete(false)}
        onDelete={deleteCashbook}
      />

      {/* Inline dropdown — no Modal, no animation, appears at tap position */}
      {showMenu && menuBook && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 98 }]}
            activeOpacity={0}
            onPress={() => setShowMenu(false)}
          />
          <View style={[s.dropCard, { top: menuY + 16 }]}>
            {[
              { key: 'rename',    icon: 'pencil-outline',          label: 'Rename',         isRed: false, onPress: () => { setShowMenu(false); setShowRename(true); } },
              { key: 'duplicate', icon: 'copy-outline',             label: 'Duplicate Book', isRed: false, onPress: () => { setShowMenu(false); navigation.navigate('DuplicateBook', { book: menuBook }); } },
              { key: 'members',   icon: 'person-add-outline',       label: 'Add Members',    isRed: false, onPress: () => { setShowMenu(false); navigation.navigate('AddBookMember', { book: menuBook }); } },
              { key: 'move',      icon: 'return-down-back-outline', label: 'Move book',      isRed: true,  onPress: () => { setShowMenu(false); navigation.navigate('MoveBook', { book: menuBook }); } },
              { key: 'delete',    icon: 'trash-outline',            label: 'Delete Book',    isRed: true,  onPress: () => { setShowMenu(false); setShowDelete(true); } },
            ].map((item, idx) => (
              <View key={item.key}>
                {idx > 0 && <View style={s.dropDivider} />}
                <TouchableOpacity style={s.dropItem} onPress={item.onPress}>
                  <View style={[s.dropIcon, item.isRed ? s.menuIconRed : s.menuIconGray]}>
                    <Ionicons name={item.icon} size={18} color={item.isRed ? colors.red : colors.gray600} />
                  </View>
                  <Text style={[s.dropLabel, item.isRed && { color: colors.red }]}>{item.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#F5F5F5' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bizSwitcher:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bizIconBox:     { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  bizName:        { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bizSubLabel:    { fontSize: typography.xs, color: colors.gray400, marginTop: 1, fontFamily: 'Poppins-Regular' },
  addPersonBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  booksHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 10, backgroundColor: '#F5F5F5' },
  booksTitle:     { fontSize: typography.xl, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  booksHeaderRight:{ flexDirection: 'row', gap: 4 },
  iconBtn:        { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  searchRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing[4], paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  searchInput:    { flex: 1, fontSize: typography.base, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  list:           { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 90 },
  bookListTop:    { height: 0 },
  bookListBottom: { height: 16, backgroundColor: '#F5F5F5' },
  bookCard:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing[4], backgroundColor: '#fff' },
  bookCardBorder: { borderTopWidth: 1, borderTopColor: colors.gray100 },
  bookIcon:       { width: 48, height: 48, borderRadius: 12, backgroundColor: '#DDDEFF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bookName:       { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bookMembersMeta:{ fontSize: typography.sm, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  bookMeta:       { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  bookRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookBalance:    { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium' },
  moreBtn:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addNewCard:     { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: spacing[4], marginHorizontal: spacing[4], flexDirection: 'row', alignItems: 'flex-start', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  addNewCardLeft: { flex: 1, minWidth: 0 },
  addNewCardTitle:{ fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  addNewCardSub:  { fontSize: typography.sm, color: colors.gray400, marginTop: 3, marginBottom: 12, fontFamily: 'Poppins-Regular' },
  suggestChips:   { gap: 10 },
  suggestRow:     { flexDirection: 'row', gap: 10 },
  suggestChip:    { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1.5, borderColor: '#93C5FD', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  suggestChipText:{ fontSize: typography.sm, color: colors.blue, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  addNewCardIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  emptyState:     { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle:     { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray500 },
  emptySub:       { fontSize: typography.base, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  emptySearch:    { alignItems: 'center', paddingTop: 30 },
  emptySearchText:{ fontSize: typography.base, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  fabWrap:        { position: 'absolute', bottom: 16, right: spacing[4], height: 48, borderRadius: 24, overflow: 'hidden', zIndex: 99, elevation: 6, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fab:            { flex: 1, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 6 },
  fabText:        { color: '#fff', fontSize: typography.sm, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHandle:    { width: 40, height: 4, backgroundColor: colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 20 },
  modalLabel:     { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray700, marginBottom: 6 },
  modalInput:     { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.md, color: colors.gray900, marginBottom: 20, fontFamily: 'Poppins-Regular' },
  modalBtn:       { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:    { opacity: 0.4 },
  modalBtnText:   { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' },
  bizSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  bizSheetTitle:  { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bizItem:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bizGridIcon:    { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  bizItemName:    { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bizItemSub:     { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  checkCircle:    { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addBizBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.blue, borderRadius: radius.xl, paddingVertical: 14, marginTop: 16 },
  addBizBtnText:  { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base },
  // Delete modal
  deleteHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  deleteCloseBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteTitle:        { flex: 1, fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  deleteHDivider:     { height: 1, backgroundColor: colors.gray100, marginBottom: 20 },
  warnBanner:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 14, marginBottom: 20 },
  warnIcon:           { marginTop: 1 },
  warnText:           { flex: 1, fontSize: typography.sm, color: '#991B1B', lineHeight: 20, fontFamily: 'Poppins-Regular' },
  confirmText:        { fontSize: typography.sm, color: colors.gray700, marginBottom: 16, fontFamily: 'Poppins-Regular' },
  deleteInputWrap:    { borderWidth: 1.5, borderColor: colors.gray300, borderRadius: 8, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, marginBottom: 20 },
  deleteInputWrapActive:{ borderColor: colors.blue },
  deleteInputLabel:   { fontSize: typography.xs, fontFamily: 'Poppins-Medium', color: colors.blue, marginBottom: 2 },
  deleteInput:        { fontSize: typography.md, color: colors.gray900, paddingVertical: 4, fontFamily: 'Poppins-Regular' },
  deleteBtn:          { backgroundColor: colors.gray100, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  deleteBtnActive:    { backgroundColor: colors.red },
  deleteBtnText:      { color: colors.gray400, fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  deleteBtnTextActive:{ color: '#fff', fontFamily: 'Poppins-Regular' },

  dropCard:  { position: 'absolute', right: 16, zIndex: 99, backgroundColor: '#fff', borderRadius: 14, minWidth: 220, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 14 },
  dropItem:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  dropIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuIconGray: { backgroundColor: colors.gray100 },
  menuIconRed:  { backgroundColor: '#FEE2E2' },
  dropLabel: { fontSize: typography.md, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  dropDivider:{ height: 1, backgroundColor: colors.gray100 },

  // Sort modal
  sortHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sortCloseBtn:      { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  sortTitle:         { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  sortDivider:       { height: 1, backgroundColor: colors.gray100, marginVertical: 8 },
  sortOption:        { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 12, marginVertical: 2 },
  sortOptionActive:  { backgroundColor: '#EEF2FF' },
  sortOptionText:    { fontSize: typography.md, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  sortOptionTextBold:{ fontFamily: 'Poppins-Medium', color: colors.gray900 },
  radioOuter:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive:  { borderColor: colors.blue },
  radioInner:        { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.blue },
  sortApplyBtn:      { marginTop: 12, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.gray100 },
  sortApplyBtnActive:{ backgroundColor: colors.blue },
  sortApplyText:     { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray400, letterSpacing: 1 },
  sortApplyTextActive:{ color: '#fff', fontFamily: 'Poppins-Regular' },

  // No Business Empty State
  noBizContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  noBizIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  noBizIconAdd: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#EEF2FF' },
  noBizTitle: { fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900, marginBottom: 8, textAlign: 'center' },
  noBizSubtitle: { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 24 },
  noBizBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blue, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.md, width: '100%', justifyContent: 'center' },
  noBizBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: typography.sm, letterSpacing: 0.5 }
});
