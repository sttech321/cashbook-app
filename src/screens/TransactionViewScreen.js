import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Alert, RefreshControl, Animated, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SlidersHorizontal, Calendar as CalendarIcon, UserPlus, FileDown, Search, XCircle, BookMarked, History, Trash2, FileSpreadsheet } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, deleteTransaction } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';
import { fm, s, b } from './TransactionViewScreenStyles';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDateHeader(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
function formatAmount(v) {
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
function isInDateRange(txn, dateFilter) {
  if (dateFilter === 'all_time') return true;
  const txnDate = new Date(txn.created_at || txn.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  switch (dateFilter) {
    case 'today': return txnDate >= today;
    case 'yesterday': return txnDate >= yesterday && txnDate < today;
    case 'this_month': return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txnDate.getMonth() === lm.getMonth() && txnDate.getFullYear() === lm.getFullYear();
    }
    default: return true;
  }
}
function buildListData(transactions) {
  if (!transactions.length) return [];
  const sorted = [...transactions].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
  let runBal = 0;
  const withBal = sorted.map((tx) => {
    if (tx.type === 'IN') runBal += Number(tx.amount);
    else runBal -= Number(tx.amount);
    return { ...tx, runningBalance: runBal };
  });
  const reversed = withBal.reverse();
  const result = []; let lastDate = null;
  reversed.forEach((tx) => {
    const dateKey = (tx.created_at || tx.date || '').slice(0, 10);
    const dateLabel = formatDateHeader(tx.created_at || tx.date);
    if (dateKey !== lastDate) { lastDate = dateKey; result.push({ _type: 'header', key: `h-${dateKey}`, dateLabel }); }
    result.push({ _type: 'txn', key: tx.id, ...tx });
  });
  return result;
}

const DATE_OPTIONS = [
  { key: 'all_time', label: 'All Time' }, { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' }, { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' }, { key: 'single_day', label: 'Single Day' },
  { key: 'date_range', label: 'Date Range' },
];
const DATE_LABELS = { all_time: 'All Time', today: 'Today', yesterday: 'Yesterday', this_month: 'This Month', last_month: 'Last Month', single_day: 'Single Day', date_range: 'Date Range' };
const ENTRY_OPTIONS = [{ key: 'all', label: 'All' }, { key: 'in', label: 'Cash In' }, { key: 'out', label: 'Cash Out' }];

const DEFAULT_FILTERS = { date: 'all_time', entryType: 'all', member: 'all', parties: [], categories: [], paymentModes: [] };

const SHEET_TITLES = {
  date: 'Select Date Filter', entryType: 'Select Entry Type Filter',
  members: 'Select Member Filter', party: 'Select Party Filter',
  category: 'Select Category Filter', paymentMode: 'Select Payment Mode Filter'
};

// ── TagChip ───────────────────────────────────────────────────────────────────

function TagChip({ label, color }) {
  return (
    <View style={[s.tag, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

// ── RadioRow ─────────────────────────────────────────────────────────────────

function RadioRow({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={[b.optRow, selected && b.optRowActive]} onPress={onPress}>
      <View style={[b.radio, selected && b.radioActive]}>
        {selected && <View style={b.radioDot} />}
      </View>
      <Text style={[b.optLabel, selected && b.optLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── CheckRow ─────────────────────────────────────────────────────────────────

function CheckRow({ label, checked, onPress }) {
  return (
    <TouchableOpacity style={b.checkRow} onPress={onPress}>
      <View style={[b.checkbox, checked && b.checkboxActive]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={b.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── FilterSheet (bottom sheet per chip) ──────────────────────────────────────

function FilterSheet({ visible, filterType, transactions, currentFilters, onClose, onApply }) {
  const [tempDate, setTempDate] = useState(currentFilters.date);
  const [tempEntry, setTempEntry] = useState(currentFilters.entryType);
  const [tempMember, setTempMember] = useState(currentFilters.member);
  const [tempParties, setTempParties] = useState([...currentFilters.parties]);
  const [tempCategories, setTempCategories] = useState([...currentFilters.categories]);
  const [tempPaymentModes, setTempPaymentModes] = useState([...currentFilters.paymentModes]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setTempDate(currentFilters.date);
      setTempEntry(currentFilters.entryType);
      setTempMember(currentFilters.member);
      setTempParties([...currentFilters.parties]);
      setTempCategories([...currentFilters.categories]);
      setTempPaymentModes([...currentFilters.paymentModes]);
      setSearch('');
    }
  }, [visible]);

  const handleClear = () => {
    if (filterType === 'date') setTempDate('all_time');
    if (filterType === 'entryType') setTempEntry('all');
    if (filterType === 'members') setTempMember('all');
    if (filterType === 'party') setTempParties([]);
    if (filterType === 'category') setTempCategories([]);
    if (filterType === 'paymentMode') setTempPaymentModes([]);
  };

  const handleApply = () => {
    onApply({ date: tempDate, entryType: tempEntry, member: tempMember, parties: tempParties, categories: tempCategories, paymentModes: tempPaymentModes });
    onClose();
  };

  const toggleCheck = (key, arr, setArr) => {
    setArr(arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key]);
  };

  // Unique values from transactions
  const allParties = [...new Set(transactions.map(tx => tx.party).filter(Boolean))];
  const allCategories = [...new Set(transactions.map(tx => tx.category).filter(Boolean))];
  const allPaymentModes = [...new Set(transactions.map(tx => tx.paymentMode).filter(Boolean))];
  const allMembers = [...new Set(transactions.map(tx => tx.createdByName || tx.user_name || tx.created_by_name).filter(Boolean))];

  const renderContent = () => {
    const q = search.toLowerCase();
    if (filterType === 'date') {
      return DATE_OPTIONS.map(opt => <RadioRow key={opt.key} label={opt.label} selected={tempDate === opt.key} onPress={() => setTempDate(opt.key)} />);
    }
    if (filterType === 'entryType') {
      return ENTRY_OPTIONS.map(opt => <RadioRow key={opt.key} label={opt.label} selected={tempEntry === opt.key} onPress={() => setTempEntry(opt.key)} />);
    }
    if (filterType === 'members') {
      const filtered = allMembers.filter(m => m.toLowerCase().includes(q));
      return (
        <>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search by name or employee id" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries by</Text>
          {filtered.map(m => <RadioRow key={m} label={m} selected={tempMember === m} onPress={() => setTempMember(m === tempMember ? 'all' : m)} />)}
          {filtered.length === 0 && <Text style={b.emptyText}>No members found</Text>}
        </>
      );
    }
    if (filterType === 'party') {
      const list = ['__no_party__', ...allParties];
      const filtered = list.filter(p => (p === '__no_party__' ? 'No Party' : p).toLowerCase().includes(q));
      return (
        <>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search Parties" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((p, i) => (
            <View key={p}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={p === '__no_party__' ? 'No Party' : p} checked={tempParties.includes(p)} onPress={() => toggleCheck(p, tempParties, setTempParties)} />
            </View>
          ))}
        </>
      );
    }
    if (filterType === 'category') {
      const list = ['__no_category__', ...allCategories];
      const filtered = list.filter(c => (c === '__no_category__' ? 'No Category' : c).toLowerCase().includes(q));
      return (
        <>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search categories" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((c, i) => (
            <View key={c}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={c === '__no_category__' ? 'No Category' : c} checked={tempCategories.includes(c)} onPress={() => toggleCheck(c, tempCategories, setTempCategories)} />
            </View>
          ))}
        </>
      );
    }
    if (filterType === 'paymentMode') {
      const list = ['__no_pm__', ...allPaymentModes];
      const filtered = list.filter(m => (m === '__no_pm__' ? 'No Payment Mode' : m).toLowerCase().includes(q));
      return (
        <>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search payment mode" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((m, i) => (
            <View key={m}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={m === '__no_pm__' ? 'No Payment Mode' : m} checked={tempPaymentModes.includes(m)} onPress={() => toggleCheck(m, tempPaymentModes, setTempPaymentModes)} />
            </View>
          ))}
        </>
      );
    }
    return null;
  };

  const hasChanges = (() => {
    if (filterType === 'date') return tempDate !== currentFilters.date;
    if (filterType === 'entryType') return tempEntry !== currentFilters.entryType;
    if (filterType === 'members') return tempMember !== currentFilters.member;
    if (filterType === 'party') return JSON.stringify(tempParties) !== JSON.stringify(currentFilters.parties);
    if (filterType === 'category') return JSON.stringify(tempCategories) !== JSON.stringify(currentFilters.categories);
    if (filterType === 'paymentMode') return JSON.stringify(tempPaymentModes) !== JSON.stringify(currentFilters.paymentModes);
    return false;
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={b.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={b.sheet}>
          {/* Header */}
          <View style={b.header}>
            <TouchableOpacity onPress={onClose} style={b.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={b.title}>{SHEET_TITLES[filterType] || 'Filter'}</Text>
          </View>

          {/* Options */}
          <ScrollView style={b.scrollArea} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {renderContent()}
          </ScrollView>

          {/* Footer */}
          <View style={b.footer}>
            <TouchableOpacity style={b.clearBtn} onPress={handleClear}>
              <Ionicons name="close" size={16} color={colors.gray400} />
              <Text style={b.clearText}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[b.applyBtn, hasChanges && { backgroundColor: colors.blue }]} onPress={handleApply}>
              <Text style={[b.applyText, hasChanges && { color: '#fff' }]}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}


// ── FullFilterModal (split screen filter) ────────────────────────────────────

function FullFilterModal({ visible, transactions, currentFilters, onClose, onApply }) {
  const [activeTab, setActiveTab] = useState('date');
  const [tempFilters, setTempFilters] = useState({ ...currentFilters });
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (visible) {
      setActiveTab('date');
      setTempFilters({
        date: currentFilters.date,
        entryType: currentFilters.entryType,
        member: currentFilters.member,
        parties: [...currentFilters.parties],
        categories: [...currentFilters.categories],
        paymentModes: [...currentFilters.paymentModes],
      });
      setSearch('');
    }
  }, [visible, currentFilters]);

  const handleClearAll = () => {
    setTempFilters({ ...DEFAULT_FILTERS });
  };

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const setTemp = (key, val) => setTempFilters(prev => ({ ...prev, [key]: val }));
  const toggleCheck = (key, arrKey) => {
    setTempFilters(prev => {
      const arr = prev[arrKey];
      const newArr = arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key];
      return { ...prev, [arrKey]: newArr };
    });
  };

  const allParties = [...new Set(transactions.map(tx => tx.party).filter(Boolean))];
  const allCategories = [...new Set(transactions.map(tx => tx.category).filter(Boolean))];
  const allPaymentModes = [...new Set(transactions.map(tx => tx.paymentMode).filter(Boolean))];
  const allMembers = [...new Set(transactions.map(tx => tx.createdByName || tx.user_name || tx.created_by_name).filter(Boolean))];

  const hasChanges = JSON.stringify(tempFilters) !== JSON.stringify(currentFilters);

  const renderContent = () => {
    const q = search.toLowerCase();
    if (activeTab === 'date') {
      return DATE_OPTIONS.map(opt => <RadioRow key={opt.key} label={opt.label} selected={tempFilters.date === opt.key} onPress={() => setTemp('date', opt.key)} />);
    }
    if (activeTab === 'entryType') {
      return ENTRY_OPTIONS.map(opt => <RadioRow key={opt.key} label={opt.label} selected={tempFilters.entryType === opt.key} onPress={() => setTemp('entryType', opt.key)} />);
    }
    if (activeTab === 'members') {
      const filtered = allMembers.filter(m => m.toLowerCase().includes(q));
      return (
        <React.Fragment>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search by name or employee id" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries by</Text>
          {filtered.map(m => <RadioRow key={m} label={m} selected={tempFilters.member === m} onPress={() => setTemp('member', m === tempFilters.member ? 'all' : m)} />)}
          {filtered.length === 0 && <Text style={b.emptyText}>No members found</Text>}
        </React.Fragment>
      );
    }
    if (activeTab === 'party') {
      const list = ['__no_party__', ...allParties];
      const filtered = list.filter(p => (p === '__no_party__' ? 'No Party' : p).toLowerCase().includes(q));
      return (
        <React.Fragment>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search Parties" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((p, i) => (
            <View key={p}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={p === '__no_party__' ? 'No Party' : p} checked={tempFilters.parties.includes(p)} onPress={() => toggleCheck(p, 'parties')} />
            </View>
          ))}
        </React.Fragment>
      );
    }
    if (activeTab === 'category') {
      const list = ['__no_category__', ...allCategories];
      const filtered = list.filter(c => (c === '__no_category__' ? 'No Category' : c).toLowerCase().includes(q));
      return (
        <React.Fragment>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search categories" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((c, i) => (
            <View key={c}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={c === '__no_category__' ? 'No Category' : c} checked={tempFilters.categories.includes(c)} onPress={() => toggleCheck(c, 'categories')} />
            </View>
          ))}
        </React.Fragment>
      );
    }
    if (activeTab === 'paymentMode') {
      const list = ['__no_pm__', ...allPaymentModes];
      const filtered = list.filter(m => (m === '__no_pm__' ? 'No Payment Mode' : m).toLowerCase().includes(q));
      return (
        <React.Fragment>
          <View style={b.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.gray400} />
            <TextInput style={b.searchInput} placeholder="Search payment mode" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <Text style={b.sectionLabel}>Entries with</Text>
          {filtered.map((m, i) => (
            <View key={m}>
              {i > 0 && <View style={b.divider} />}
              <CheckRow label={m === '__no_pm__' ? 'No Payment Mode' : m} checked={tempFilters.paymentModes.includes(m)} onPress={() => toggleCheck(m, 'paymentModes')} />
            </View>
          ))}
        </React.Fragment>
      );
    }
    return null;
  };

  const tabs = [
    { key: 'date', label: 'Date' },
    { key: 'entryType', label: 'Entry Type' },
    { key: 'members', label: 'Members' },
    { key: 'party', label: 'Party' },
    { key: 'category', label: 'Category' },
    { key: 'paymentMode', label: 'Payment Mode' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={fm.header}>
          <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={fm.title}>Filters</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Body */}
        <View style={fm.body}>
          {/* Sidebar */}
          <View style={fm.sidebar}>
            {tabs.map(t => {
              const active = activeTab === t.key;
              return (
                <TouchableOpacity key={t.key} style={[fm.tab, active && fm.tabActive]} onPress={() => { setActiveTab(t.key); setSearch(''); }}>
                  <Text style={[fm.tabText, active && fm.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Content */}
          <View style={fm.content}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }} keyboardShouldPersistTaps="handled">
              {renderContent()}
            </ScrollView>
          </View>
        </View>

        {/* Footer */}
        <View style={fm.footer}>
          <TouchableOpacity style={fm.clearBtn} onPress={handleClearAll}>
            <Ionicons name="close" size={18} color={colors.gray500} />
            <Text style={fm.clearText}>CLEAR ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[fm.applyBtn, hasChanges && fm.applyBtnActive]} onPress={handleApply}>
            <Text style={[fm.applyText, hasChanges && fm.applyTextActive]}>APPLY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}



// ── TransactionViewScreen ─────────────────────────────────────────────────────

export default function TransactionViewScreen({ route, navigation }) {
  const { bookId, bookName } = route.params;
  const { currentBusinessId } = useApp();

  const [transactions, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [activeSheet, setActiveSheet] = useState(null);
  const [fullFilterVisible, setFullFilterVisible] = useState(false); // null | 'date' | 'entryType' | 'members' | 'party' | 'category' | 'paymentMode'
  const [menuVisible, setMenuVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTransactions(currentBusinessId, bookId);
      setTxns(data.transactions || []);
    } catch (err) {
      if (err.status !== 401) Alert.alert('Error', err.message);
    } finally { setLoading(false); }
  }, [currentBusinessId, bookId]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const showToast = (msg) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const confirmDelete = (txn) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(currentBusinessId, bookId, txn.id);
            setTxns((prev) => prev.filter((tx) => tx.id !== txn.id));
          } catch (err) { Alert.alert('Error', err.message); }
        }
      },
    ]);
  };

  // ── filter logic ─────────────────────────────────────────────────────────
  const filteredTxns = transactions.filter((tx) => {
    const matchDate = isInDateRange(tx, filters.date);
    const matchType = filters.entryType === 'all' || (filters.entryType === 'in' ? tx.type === 'IN' : tx.type === 'OUT');
    const txMember = tx.createdByName || tx.user_name || tx.created_by_name || null;
    const matchMember = filters.member === 'all' || txMember === filters.member;
    const matchParty = filters.parties.length === 0 || filters.parties.includes(tx.party || '__no_party__');
    const matchCat = filters.categories.length === 0 || filters.categories.includes(tx.category || '__no_category__');
    const matchPM = filters.paymentModes.length === 0 || filters.paymentModes.includes(tx.paymentMode || '__no_pm__');
    const matchSearch = !searchQuery
      || tx.party?.toLowerCase().includes(searchQuery.toLowerCase())
      || tx.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
      || String(tx.amount).includes(searchQuery);
    return matchDate && matchType && matchMember && matchParty && matchCat && matchPM && matchSearch;
  });

  const totalIn = filteredTxns.filter(tx => tx.type === 'IN').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalOut = filteredTxns.filter(tx => tx.type === 'OUT').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netBal = totalIn - totalOut;
  const listData = buildListData(filteredTxns);
  const isEmpty = transactions.length === 0;

  // ── chip display labels ───────────────────────────────────────────────────
  const dateLabelChip = filters.date !== 'all_time' ? DATE_LABELS[filters.date] : 'Select Date';
  const entryLabelChip = filters.entryType === 'in' ? 'Cash In' : filters.entryType === 'out' ? 'Cash Out' : 'Entry Type';
  const memberLabelChip = filters.member !== 'all' ? filters.member : 'Members';
  const partyLabelChip = filters.parties.length > 0 ? `${filters.parties.length} ${filters.parties.length === 1 ? 'Party' : 'Parties'}` : 'Party';
  const categoryLabelChip = filters.categories.length > 0 ? `${filters.categories.length} ${filters.categories.length === 1 ? 'Category' : 'Categories'}` : 'Category';
  const pmLabelChip = filters.paymentModes.length > 0 ? `${filters.paymentModes.length} Mode${filters.paymentModes.length > 1 ? 's' : ''}` : 'Payment Mode';

  const isDateActive = filters.date !== 'all_time';
  const isEntryActive = filters.entryType !== 'all';
  const isMemberActive = filters.member !== 'all';
  const isPartyActive = filters.parties.length > 0;
  const isCatActive = filters.categories.length > 0;
  const isPMActive = filters.paymentModes.length > 0;
  const hasAnyFilter = isDateActive || isEntryActive || isMemberActive || isPartyActive || isCatActive || isPMActive;

  const CHIPS = [
    { key: 'date', label: dateLabelChip, active: isDateActive, lucideIcon: CalendarIcon },
    { key: 'entryType', label: entryLabelChip, active: isEntryActive, icon: null },
    { key: 'members', label: memberLabelChip, active: isMemberActive, icon: null },
    { key: 'party', label: partyLabelChip, active: isPartyActive, icon: null },
    { key: 'category', label: categoryLabelChip, active: isCatActive, icon: null },
    { key: 'paymentMode', label: pmLabelChip, active: isPMActive, icon: null },
  ];

  const renderItem = ({ item }) => {
    if (item._type === 'header') return <Text style={s.dateHeader}>{item.dateLabel}</Text>;
    const isIN = item.type === 'IN';
    const hasAttachment = item.attachments?.length > 0 || item.attachment;
    return (
      <TouchableOpacity
        style={s.txnRow}
        onPress={() => navigation.navigate('EntryDetail', { transaction: item, bookId, bookName })}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <View style={s.txnTop}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              {item.paymentMode ? (
                <View style={s.paymentBadge}>
                  <Text style={s.paymentBadgeText}>{item.paymentMode}</Text>
                </View>
              ) : item.party ? (
                <Text style={s.txnParty}>{item.party}</Text>
              ) : null}
              {item.remarks ? <Text style={s.txnRemarks} numberOfLines={1}>{item.remarks}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.txnAmount, { color: isIN ? colors.green : colors.red }]}>{formatAmount(item.amount)}</Text>
              <Text style={s.txnBalance}>Balance: {formatAmount(item.runningBalance)}</Text>
            </View>
          </View>
          {hasAttachment && (
            <View style={s.attachmentRow}>
              <Ionicons name="attach" size={14} color={colors.gray400} />
              <Text style={s.attachmentText}>1 Attachment</Text>
            </View>
          )}
          <View style={s.txnBottom}>
            <Text style={s.txnEntry}><Text style={{ color: colors.green, fontFamily: 'Poppins-Medium' }}>Entry by You</Text>  at {formatTime(item.created_at || item.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerBg}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray900} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('BookSettings', { bookId, bookName })}>
            <Text style={s.headerTitle} numberOfLines={1}>{bookName}</Text>
            <Text style={s.headerSub}>Tap here for Book settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => navigation.navigate('Team')}>
            <UserPlus size={20} color={colors.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.pdfIconBtn}
            onPress={() => navigation.navigate('GenerateReport', { bookId, bookName, filters, searchQuery })}
          >
            {/* <FileDown size={16} color={colors.blue} style={{ marginRight: 4 }} /> */}
            <Text style={s.pdfIconText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.blue} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchRow}>
          <Search size={16} color={colors.blue} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by remark or amount"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <XCircle size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={loading ? [] : listData}
        keyExtractor={(item) => item.key || item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        ListHeaderComponent={
          <>
            {/* Filter chips row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
              {/* Main filter icon */}
              <TouchableOpacity
                style={[s.filterIconBtn, hasAnyFilter && s.filterIconBtnActive]}
                onPress={() => setFullFilterVisible(true)}
              >
                <SlidersHorizontal size={18} color={colors.blue} />
              </TouchableOpacity>

              {/* Individual filter chips */}
              {CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[s.filterChip, chip.active && s.filterChipActive]}
                  onPress={() => setActiveSheet(chip.key)}
                >
                  {chip.lucideIcon ? (
                    <chip.lucideIcon size={14} color={chip.active ? colors.blue : colors.gray600} style={{ marginRight: 6 }} />
                  ) : chip.icon ? (
                    <Ionicons name={chip.icon} size={14} color={chip.active ? colors.blue : colors.gray500} style={{ marginRight: 4 }} />
                  ) : null}
                  <Text style={[s.filterChipText, chip.active && s.filterChipTextActive]}>{chip.label}</Text>
                  <Ionicons name="chevron-down" size={11} color={chip.active ? colors.blue : colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Balance card */}
            <View style={s.balCard}>
              <View style={s.balCardTop}>
                <Text style={s.balLabel}>Net Balance</Text>
                <Text style={s.balAmount}>{formatAmount(netBal)}</Text>
              </View>
              <View style={s.balCardRow}>
                <View style={s.balCardItem}>
                  <Text style={s.balSmLabel}>Total In (+)</Text>
                  <Text style={[s.balSmAmount, { color: colors.green }]}>{formatAmount(totalIn)}</Text>
                </View>
                <View style={s.balCardItem}>
                  <Text style={s.balSmLabel}>Total Out (-)</Text>
                  <Text style={[s.balSmAmount, { color: colors.red }]}>{formatAmount(totalOut)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.viewReportsBtn}
                onPress={() => navigation.navigate('GenerateReport', { bookId, bookName, filters, searchQuery })}
              >
                <Text style={s.viewReportsText}>VIEW REPORTS</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.blue} />
              </TouchableOpacity>
            </View>

            {/* Count */}
            <View style={s.countLabelWrap}>
              <View style={s.countLine} />
              <Text style={s.countLabel}>Showing {filteredTxns.length} {filteredTxns.length === 1 ? 'entry' : 'entries'}</Text>
              <View style={s.countLine} />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={s.center}><Text style={{ color: colors.gray400 }}>Loading...</Text></View>
          ) : (
            <View style={s.emptyState}>
              <View style={s.privacyBadge}>
                <Ionicons name="lock-closed" size={18} color={colors.gray400} />
                <Text style={s.privacyText}>Only you can see these entries</Text>
              </View>
              <View style={s.emptyContent}>
                <Text style={s.emptyTitle}>Add your first entry</Text>
                <Ionicons name="arrow-down" size={28} color={colors.blue} style={{ marginVertical: 8 }} />
                <View style={s.emptyLabels}>
                  <Text style={[s.emptyLabel, { color: colors.green }]}>Record Income</Text>
                  <Text style={[s.emptyLabel, { color: colors.red }]}>Record Expense</Text>
                </View>
              </View>
            </View>
          )
        }
        ListFooterComponent={
          (!loading && !isEmpty) ? (
            <View style={s.privacyBadge}>
              <Ionicons name="lock-closed" size={16} color={colors.gray400} />
              <Text style={s.privacyText}>Only you can see these entries</Text>
            </View>
          ) : null
        }
      />

      {/* CASH IN / CASH OUT */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={[s.bottomBtn, { backgroundColor: colors.green }]} onPress={() => navigation.navigate('AddEntry', { type: 'IN', bookId, bookName })}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.bottomBtnText}>CASH IN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.bottomBtn, { backgroundColor: colors.red }]} onPress={() => navigation.navigate('AddEntry', { type: 'OUT', bookId, bookName })}>
          <Ionicons name="remove" size={18} color="#fff" />
          <Text style={s.bottomBtnText}>CASH OUT</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {toast && (
        <Animated.View style={[s.toast, { opacity: toastAnim }]}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={s.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Filter bottom sheet */}
      {activeSheet && (
        <FilterSheet
          visible={!!activeSheet}
          filterType={activeSheet}
          transactions={transactions}
          currentFilters={filters}
          onClose={() => setActiveSheet(null)}
          onApply={(applied) => setFilters(applied)}
        />
      )}

      {/* Full Filter Modal (Split Screen) */}
      {fullFilterVisible && (
        <FullFilterModal
          visible={fullFilterVisible}
          transactions={transactions}
          currentFilters={filters}
          onClose={() => setFullFilterVisible(false)}
          onApply={(applied) => setFilters(applied)}
        />
      )}

      {/* Top Right Popup Menu */}
      <Modal transparent={true} visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={s.menuContainer}>
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('BookSettings', { bookId, bookName }); }}>
              <BookMarked size={18} color={colors.gray} />
              <Text style={s.menuItemText}>Book Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('BookActivity', { bookId, bookName }); }}>
              <History size={18} color={colors.gray} />
              <Text style={s.menuItemText}>Book Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('DeleteAllEntries', { bookId, bookName }); }}>
              <Trash2 size={18} color={colors.gray} />
              <Text style={s.menuItemText}>Delete All Entries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('ExcelReport', { bookId, bookName }); }}>
              <FileSpreadsheet size={18} color={colors.gray} />
              <Text style={s.menuItemText}>Excel Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Main screen styles ────────────────────────────────────────────────────────



// ── Bottom sheet styles ───────────────────────────────────────────────────────



