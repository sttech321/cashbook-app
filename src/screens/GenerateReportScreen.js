import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

// ── constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  date: 'all_time', entryType: 'all', member: 'all',
  parties: [], categories: [], paymentModes: [] };

const DATE_OPTIONS = [
  { key: 'all_time',   label: 'All Time'   },
  { key: 'today',      label: 'Today'      },
  { key: 'yesterday',  label: 'Yesterday'  },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'single_day', label: 'Single Day' },
  { key: 'date_range', label: 'Date Range' },
];

const ENTRY_OPTIONS = [
  { key: 'all', label: 'All'      },
  { key: 'in',  label: 'Cash In'  },
  { key: 'out', label: 'Cash Out' },
];

const DATE_LABELS = {
  all_time: 'All Time', today: 'Today', yesterday: 'Yesterday',
  this_month: 'This Month', last_month: 'Last Month',
  single_day: 'Single Day', date_range: 'Date Range' };

const SHEET_TITLES = {
  date: 'Select Date Filter', entryType: 'Select Entry Type Filter',
  members: 'Select Member Filter', party: 'Select Party Filter',
  category: 'Select Category Filter', paymentMode: 'Select Payment Mode Filter' };

const REPORT_TYPES = [
  { key: 'all_entries',   title: 'All Entries Report',    subtitle: 'List of all entries and details'         },
  { key: 'day_wise',      title: 'Day-wise summary',      subtitle: 'Day-wise total in, out & balance'        },
  { key: 'party_wise',    title: 'Party-wise summary',    subtitle: 'Party-wise total in, out & balance'      },
  { key: 'category_wise', title: 'Category-wise summary', subtitle: 'Income & expenses of all categories'     },
  { key: 'payment_modes', title: 'Payment Modes summary', subtitle: 'Income & expenses by all payment modes'  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function isInDateRange(txn, dateFilter) {
  if (dateFilter === 'all_time') return true;
  const txnDate = new Date(txn.created_at || txn.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  switch (dateFilter) {
    case 'today':      return txnDate >= today;
    case 'yesterday':  return txnDate >= yesterday && txnDate < today;
    case 'this_month': return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txnDate.getMonth() === lm.getMonth() && txnDate.getFullYear() === lm.getFullYear();
    }
    default: return true;
  }
}

function fmtTableDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function fmtAmount(v) {
  const n = Number(v || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function nowLabel() {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0');
  const ampm = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${m} ${ampm}`;
}

// ── PDF HTML builder ─────────────────────────────────────────────────────────

function buildPdfHtml({ bizName, bookName, userName, userPhone, durationLabel, filteredTxns }) {
  const totalIn  = filteredTxns.filter(t => t.type === 'IN').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filteredTxns.filter(t => t.type === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
  const balance  = totalIn - totalOut;

  // Build running balance per row
  let runBal = 0;
  const sorted = [...filteredTxns].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
  const withBal = sorted.map(tx => {
    runBal += tx.type === 'IN' ? Number(tx.amount) : -Number(tx.amount);
    return { ...tx, runBal };
  });

  const rows = withBal.map(tx => `
    <tr>
      <td>${fmtTableDate(tx.created_at || tx.date)}</td>
      <td>${tx.remarks || ''}</td>
      <td>${tx.createdByName || tx.user_name || 'You'}</td>
      <td>${tx.party || ''}</td>
      <td>${tx.category || ''}</td>
      <td>${tx.paymentMode || ''}</td>
      <td class="cash-in-cell">${tx.type === 'IN' ? fmtAmount(tx.amount) : ''}</td>
      <td class="cash-out-cell">${tx.type === 'OUT' ? fmtAmount(tx.amount) : ''}</td>
      <td>${fmtAmount(tx.runBal)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#333; padding:20px; }
  .hdr { background:#EFF6FF; padding:14px 16px; display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .hdr-logo { width:44px; height:44px; background:#2563EB; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; color:#fff; }
  .hdr-info h2 { font-size:15px; font-weight:700; color:#111; }
  .hdr-info p  { font-size:11px; color:#6B7280; margin-top:2px; }
  .biz { font-weight:700; font-size:14px; margin:12px 0 8px; }
  .dur { border:1px solid #E5E7EB; padding:8px 12px; margin-bottom:14px; font-size:12px; }
  .summary { display:flex; border:1px solid #E5E7EB; margin-bottom:14px; }
  .sc { flex:1; padding:10px 12px; }
  .sc+.sc { border-left:1px solid #E5E7EB; }
  .sc .lbl { font-size:10px; color:#6B7280; margin-bottom:3px; }
  .sc .val { font-size:20px; font-weight:700; }
  .green { color:#16A34A; }
  .red   { color:#DC2626; }
  .entries { font-size:12px; color:#374151; margin-bottom:8px; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { background:#F9FAFB; border:1px solid #E5E7EB; padding:6px 8px; text-align:left; font-weight:600; }
  td { border:1px solid #E5E7EB; padding:5px 8px; }
  .fr td { font-weight:700; background:#F9FAFB; }
  .cash-in-cell  { color:#16A34A; font-weight:600; }
  .cash-out-cell { color:#DC2626; font-weight:600; }
  .footer { margin-top:20px; display:flex; align-items:center; gap:8px; font-size:11px; color:#9CA3AF; }
  .fl { width:22px; height:22px; background:#2563EB; border-radius:4px; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:12px; }
  @media print { @page { margin:1cm; } body { padding:5px; } }
</style>
</head>
<body>
  <div class="hdr">
    <div class="hdr-logo">C</div>
    <div class="hdr-info">
      <h2>${bookName} Report</h2>
      <p>Generated On - ${nowLabel()}. Generated by - ${userName}${userPhone ? ' ('+userPhone+')' : ''}</p>
    </div>
  </div>
  <p class="biz">${bizName}</p>
  <div class="dur">Duration:&nbsp; ${durationLabel}</div>
  <div class="summary">
    <div class="sc"><div class="lbl">Total Cash in</div><div class="val green">${fmtAmount(totalIn)}</div></div>
    <div class="sc"><div class="lbl">Total Cash out</div><div class="val red">${fmtAmount(totalOut)}</div></div>
    <div class="sc"><div class="lbl">Final Balance</div><div class="val">${fmtAmount(balance)}</div></div>
  </div>
  <p class="entries">Total No. of entries: ${filteredTxns.length}</p>
  <table>
    <tr>
      <th>Date</th><th>Remark</th><th>Entry by</th><th>Party</th>
      <th>Category</th><th>Mode</th><th>Cash in</th><th>Cash out</th><th>Balance</th>
    </tr>
    ${rows}
    <tr class="fr">
      <td>${fmtTableDate(new Date().toISOString())}</td>
      <td>Final Balance</td><td></td><td></td><td></td><td></td><td></td><td></td>
      <td>${fmtAmount(balance)}</td>
    </tr>
  </table>
  <div class="footer">
    <span class="fl">C</span>
    <span>Generated by CashBook App.</span>
  </div>
</body>
</html>`;
}

// ── StoragePermissionModal ────────────────────────────────────────────────────

function StoragePermissionModal({ visible, onClose }) {
  const STEPS = [
    "Click on 'Open Settings'",
    "Then click on 'Permissions' on App Info screen",
    "Click on 'File and Media or Storage'",
    "Select 'Allow'",
  ];

  const handleOpenSettings = async () => {
    onClose();
    try { await Linking.openSettings(); } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.card}>
          <Text style={pm.title}>Allow Storage Permissions</Text>
          <Text style={pm.subtitle}>
            Please follow steps below and allow media or storage permission for CashBook app.
          </Text>
          <View style={pm.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={pm.stepRow}>
                <View style={pm.bullet} />
                <Text style={pm.stepText}>
                  {step.split(/('.*?')/g).map((part, j) =>
                    part.startsWith("'") && part.endsWith("'")
                      ? <Text key={j} style={pm.bold}>{part}</Text>
                      : part
                  )}
                </Text>
              </View>
            ))}
          </View>
          <View style={pm.btnRow}>
            <TouchableOpacity style={pm.cancelBtn} onPress={onClose}>
              <Text style={pm.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.openBtn} onPress={handleOpenSettings}>
              <Text style={pm.openText}>OPEN SETTINGS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── RadioRow / CheckRow / FilterSheet (same as TransactionViewScreen) ─────────

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

function FilterSheet({ visible, filterType, transactions, currentFilters, onClose, onApply }) {
  const [tempDate,         setTempDate]         = useState(currentFilters.date);
  const [tempEntry,        setTempEntry]        = useState(currentFilters.entryType);
  const [tempMember,       setTempMember]       = useState(currentFilters.member);
  const [tempParties,      setTempParties]      = useState([...currentFilters.parties]);
  const [tempCategories,   setTempCategories]   = useState([...currentFilters.categories]);
  const [tempPaymentModes, setTempPaymentModes] = useState([...currentFilters.paymentModes]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setTempDate(currentFilters.date); setTempEntry(currentFilters.entryType);
      setTempMember(currentFilters.member); setTempParties([...currentFilters.parties]);
      setTempCategories([...currentFilters.categories]); setTempPaymentModes([...currentFilters.paymentModes]);
      setSearch('');
    }
  }, [visible]);

  const handleClear = () => {
    if (filterType === 'date')        setTempDate('all_time');
    if (filterType === 'entryType')   setTempEntry('all');
    if (filterType === 'members')     setTempMember('all');
    if (filterType === 'party')       setTempParties([]);
    if (filterType === 'category')    setTempCategories([]);
    if (filterType === 'paymentMode') setTempPaymentModes([]);
  };

  const handleApply = () => {
    onApply({ date: tempDate, entryType: tempEntry, member: tempMember, parties: tempParties, categories: tempCategories, paymentModes: tempPaymentModes });
    onClose();
  };

  const toggleCheck = (key, arr, setArr) => setArr(arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key]);

  const allParties      = [...new Set(transactions.map(tx => tx.party).filter(Boolean))];
  const allCategories   = [...new Set(transactions.map(tx => tx.category).filter(Boolean))];
  const allPaymentModes = [...new Set(transactions.map(tx => tx.paymentMode).filter(Boolean))];
  const allMembers      = [...new Set(transactions.map(tx => tx.createdByName || tx.user_name || tx.created_by_name).filter(Boolean))];
  const q = search.toLowerCase();

  const renderContent = () => {
    if (filterType === 'date')      return DATE_OPTIONS.map(o => <RadioRow key={o.key} label={o.label} selected={tempDate === o.key} onPress={() => setTempDate(o.key)} />);
    if (filterType === 'entryType') return ENTRY_OPTIONS.map(o => <RadioRow key={o.key} label={o.label} selected={tempEntry === o.key} onPress={() => setTempEntry(o.key)} />);
    if (filterType === 'members') {
      const fl = allMembers.filter(m => m.toLowerCase().includes(q));
      return (<><View style={b.searchBox}><Ionicons name="search-outline" size={18} color={colors.gray400} /><TextInput style={b.searchInput} placeholder="Search by name or employee id" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} /></View><Text style={b.sectionLabel}>Entries by</Text>{fl.map(m => <RadioRow key={m} label={m} selected={tempMember === m} onPress={() => setTempMember(m === tempMember ? 'all' : m)} />)}{fl.length === 0 && <Text style={b.emptyText}>No members found</Text>}</>);
    }
    if (filterType === 'party') {
      const list = ['__no_party__', ...allParties].filter(p => (p === '__no_party__' ? 'No Party' : p).toLowerCase().includes(q));
      return (<><View style={b.searchBox}><Ionicons name="search-outline" size={18} color={colors.gray400} /><TextInput style={b.searchInput} placeholder="Search Parties" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} /></View><Text style={b.sectionLabel}>Entries with</Text>{list.map((p, i) => (<View key={p}>{i > 0 && <View style={b.divider} />}<CheckRow label={p === '__no_party__' ? 'No Party' : p} checked={tempParties.includes(p)} onPress={() => toggleCheck(p, tempParties, setTempParties)} /></View>))}</>);
    }
    if (filterType === 'category') {
      const list = ['__no_category__', ...allCategories].filter(c => (c === '__no_category__' ? 'No Category' : c).toLowerCase().includes(q));
      return (<><View style={b.searchBox}><Ionicons name="search-outline" size={18} color={colors.gray400} /><TextInput style={b.searchInput} placeholder="Search categories" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} /></View><Text style={b.sectionLabel}>Entries with</Text>{list.map((c, i) => (<View key={c}>{i > 0 && <View style={b.divider} />}<CheckRow label={c === '__no_category__' ? 'No Category' : c} checked={tempCategories.includes(c)} onPress={() => toggleCheck(c, tempCategories, setTempCategories)} /></View>))}</>);
    }
    if (filterType === 'paymentMode') {
      const list = ['__no_pm__', ...allPaymentModes].filter(m => (m === '__no_pm__' ? 'No Payment Mode' : m).toLowerCase().includes(q));
      return (<><View style={b.searchBox}><Ionicons name="search-outline" size={18} color={colors.gray400} /><TextInput style={b.searchInput} placeholder="Search payment mode" placeholderTextColor={colors.gray400} value={search} onChangeText={setSearch} /></View><Text style={b.sectionLabel}>Entries with</Text>{list.map((m, i) => (<View key={m}>{i > 0 && <View style={b.divider} />}<CheckRow label={m === '__no_pm__' ? 'No Payment Mode' : m} checked={tempPaymentModes.includes(m)} onPress={() => toggleCheck(m, tempPaymentModes, setTempPaymentModes)} /></View>))}</>);
    }
    return null;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={b.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={b.sheet}>
          <View style={b.header}><TouchableOpacity onPress={onClose} style={b.closeBtn}><Ionicons name="close" size={22} color={colors.gray700} /></TouchableOpacity><Text style={b.title}>{SHEET_TITLES[filterType] || 'Filter'}</Text></View>
          <ScrollView style={b.scrollArea} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">{renderContent()}</ScrollView>
          <View style={b.footer}><TouchableOpacity style={b.clearBtn} onPress={handleClear}><Ionicons name="close" size={16} color={colors.gray400} /><Text style={b.clearText}>CLEAR</Text></TouchableOpacity><TouchableOpacity style={b.applyBtn} onPress={handleApply}><Text style={b.applyText}>APPLY</Text></TouchableOpacity></View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── GenerateReportScreen ──────────────────────────────────────────────────────

export default function GenerateReportScreen({ route, navigation }) {
  const { bookId, bookName, filters: initFilters = {}, searchQuery = '' } = route.params || {};
  const { currentBusinessId, currentBusiness, user } = useApp();

  const [filters, setFilters]             = useState({ ...DEFAULT_FILTERS, ...initFilters });
  const [activeSheet, setActiveSheet]     = useState(null);
  const [reportType, setReportType]       = useState('all_entries');
  const [transactions, setTransactions]   = useState([]);
  const [showPermModal, setShowPermModal] = useState(false);
  const [generating, setGenerating]       = useState(false);

  useEffect(() => {
    if (!currentBusinessId || !bookId) return;
    getTransactions(currentBusinessId, bookId)
      .then(data => setTransactions(data.transactions || []))
      .catch(() => {});
  }, [currentBusinessId, bookId]);

  // Apply filters to get the subset used in the report
  const filteredTxns = transactions.filter(tx => {
    const matchDate   = isInDateRange(tx, filters.date);
    const matchType   = filters.entryType === 'all' || (filters.entryType === 'in' ? tx.type === 'IN' : tx.type === 'OUT');
    const matchParty  = filters.parties.length === 0 || filters.parties.includes(tx.party || '__no_party__');
    const matchCat    = filters.categories.length === 0 || filters.categories.includes(tx.category || '__no_category__');
    const matchPM     = filters.paymentModes.length === 0 || filters.paymentModes.includes(tx.paymentMode || '__no_pm__');
    return matchDate && matchType && matchParty && matchCat && matchPM;
  });

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const html = buildPdfHtml({
        bizName:       currentBusiness?.name || 'My Business',
        bookName:      bookName || 'Report',
        userName:      user?.name || user?.email || 'User',
        userPhone:     user?.mobile || user?.phone || '',
        durationLabel: DATE_LABELS[filters.date] || 'All Time',
        filteredTxns });

      if (Platform.OS === 'web') {
        // Open in new tab and trigger browser print-to-PDF
        const win = window.open('', '_blank');
        if (!win) { Alert.alert('Popup Blocked', 'Please allow popups for this site to generate PDF.'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      } else {
        // Native: show storage permission guidance first
        setShowPermModal(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF. ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateExcel = () => {
    if (Platform.OS === 'web') {
      // Build CSV and download
      const headers = ['Date','Remark','Entry by','Party','Category','Mode','Cash In','Cash Out','Balance'];
      let runBal = 0;
      const sorted = [...filteredTxns].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
      const rows = sorted.map(tx => {
        runBal += tx.type === 'IN' ? Number(tx.amount) : -Number(tx.amount);
        const cashIn  = tx.type === 'IN' ? fmtAmount(tx.amount) : '';
        const cashOut = tx.type === 'OUT' ? fmtAmount(tx.amount) : '';
        return [
          fmtTableDate(tx.created_at || tx.date),
          tx.remarks || '',
          tx.createdByName || tx.user_name || 'You',
          tx.party || '',
          tx.category || '',
          tx.paymentMode || '',
          cashIn, cashOut, fmtAmount(runBal),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${(bookName || 'report').replace(/\s+/g, '_')}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Native: show storage permission guidance
      setShowPermModal(true);
    }
  };

  // Display labels
  const durationLabel = DATE_LABELS[filters.date] || 'All Time';
  const entryLabel    = filters.entryType === 'in' ? 'Cash In' : filters.entryType === 'out' ? 'Cash Out' : 'All';
  const catLabel      = filters.categories?.length > 0 ? `${filters.categories.length} Selected` : 'All';
  const partyLabel    = filters.parties?.length > 0 ? `${filters.parties.length} Selected` : 'All';
  const pmLabel       = filters.paymentModes?.length > 0 ? `${filters.paymentModes.length} Selected` : 'All';

  const SUMMARY_ROWS = [
    [
      { label: 'Duration',    value: durationLabel, sheet: 'date'        },
      { label: 'Entry Type',  value: entryLabel,    sheet: 'entryType'   },
      { label: 'Category',    value: catLabel,      sheet: 'category'    },
      { label: 'Party',       value: partyLabel,    sheet: 'party'       },
    ],
    [
      { label: 'Payment Mode', value: pmLabel,            sheet: 'paymentMode' },
      { label: 'Search Term',  value: searchQuery || 'None', sheet: null       },
    ],
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Generate Report</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('PDFSettings', { bookId, bookName })}>
          <View>
            <Ionicons name="settings-outline" size={24} color={colors.gray600} />
            <View style={s.redDot} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Filter summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Report will be generated for</Text>
          {SUMMARY_ROWS.map((row, ri) => (
            <View key={ri} style={s.summaryRow}>
              {row.map((cell, ci) => (
                <TouchableOpacity
                  key={ci}
                  style={[s.summaryCell, ci > 0 && s.summaryCellBorder]}
                  onPress={() => cell.sheet && setActiveSheet(cell.sheet)}
                  activeOpacity={cell.sheet ? 0.6 : 1}
                >
                  <Text style={s.summaryLabel}>{cell.label}</Text>
                  <View style={s.summaryValueRow}>
                    <Text style={s.summaryValue}>{cell.value}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={s.separator} />

        {/* Report type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Report Type</Text>
          {REPORT_TYPES.map((rpt) => {
            const active = reportType === rpt.key;
            return (
              <TouchableOpacity key={rpt.key} style={[s.rptRow, active && s.rptRowActive]} onPress={() => setReportType(rpt.key)}>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rptTitle, active && s.rptTitleActive]}>{rpt.title}</Text>
                  <Text style={s.rptSubtitle}>{rpt.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.excelBtn} onPress={handleGenerateExcel}>
          <Ionicons name="grid-outline" size={20} color={colors.blue} />
          <Text style={s.excelText}>GENERATE EXCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.pdfBtn, generating && { opacity: 0.7 }]} onPress={handleGeneratePDF} disabled={generating}>
          <Ionicons name="document-outline" size={20} color="#fff" />
          <Text style={s.pdfText}>{generating ? 'GENERATING...' : 'GENERATE PDF'}</Text>
        </TouchableOpacity>
      </View>

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

      {/* Storage permission modal */}
      <StoragePermissionModal visible={showPermModal} onClose={() => setShowPermModal(false)} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#fff' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  redDot:           { position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
  section:          { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  sectionTitle:     { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: spacing[4] },
  summaryRow:       { flexDirection: 'row', marginBottom: 16 },
  summaryCell:      { flex: 1, paddingHorizontal: 8 },
  summaryCellBorder:{ borderLeftWidth: 1, borderLeftColor: colors.gray200 },
  summaryLabel:     { fontSize: typography.sm, color: colors.gray500, marginBottom: 3, fontFamily: 'Poppins-Regular' },
  summaryValueRow:  { flexDirection: 'row', alignItems: 'center' },
  summaryValue:     { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.blue },
  separator:        { height: 1, backgroundColor: colors.gray100 },
  rptRow:           { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, paddingHorizontal: 14, borderRadius: radius.xl, marginBottom: 4 },
  rptRowActive:     { backgroundColor: '#EEEEFF' },
  radio:            { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: colors.blue },
  radioDot:         { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
  rptTitle:         { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray800 },
  rptTitleActive:   { color: colors.gray900, fontFamily: 'Poppins-Regular' },
  rptSubtitle:      { fontSize: typography.sm, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100 },
  excelBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderWidth: 1.5, borderColor: colors.blue, margin: 12, marginBottom: 6, borderRadius: radius.xl },
  excelText:        { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 0.5 },
  pdfBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, backgroundColor: colors.blue, marginHorizontal: 12, marginBottom: 12, borderRadius: radius.xl },
  pdfText:          { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: '#fff', letterSpacing: 0.5 } });

// ── Permission modal styles ───────────────────────────────────────────────────

const pm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:       { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: 24, width: '100%', maxWidth: 400 },
  title:      { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 10 },
  subtitle:   { fontSize: typography.base, color: colors.gray600, lineHeight: 20, marginBottom: 20, fontFamily: 'Poppins-Regular' },
  steps:      { gap: 14, marginBottom: 28 },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bullet:     { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray400, marginTop: 5 },
  stepText:   { flex: 1, fontSize: typography.base, color: colors.gray700, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  bold:       { fontFamily: 'Poppins-Medium', color: colors.gray900 },
  btnRow:     { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.blue, alignItems: 'center' },
  cancelText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  openBtn:    { flex: 1.5, paddingVertical: 14, borderRadius: radius.xl, backgroundColor: colors.blue, alignItems: 'center' },
  openText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 } });

// ── Bottom sheet styles ───────────────────────────────────────────────────────

const b = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing[4], paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  closeBtn:     { width: 28 },
  title:        { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  scrollArea:   { flexGrow: 0 },
  optRow:       { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 16, paddingHorizontal: spacing[4] },
  optRowActive: { backgroundColor: '#EEEEFF' },
  radio:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive:  { borderColor: colors.blue },
  radioDot:     { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.blue },
  optLabel:     { fontSize: typography.md, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  optLabelActive:{ color: colors.gray900, fontFamily: 'Poppins-Medium' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing[4], marginTop: 12, marginBottom: 4, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:  { flex: 1, fontSize: typography.base, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  sectionLabel: { fontSize: typography.sm, color: colors.gray400, paddingHorizontal: spacing[4], paddingTop: 14, paddingBottom: 6, fontFamily: 'Poppins-Regular' },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 16, paddingHorizontal: spacing[4] },
  checkbox:     { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:{ backgroundColor: colors.blue, borderColor: colors.blue },
  checkLabel:   { fontSize: typography.md, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  divider:      { height: 1, backgroundColor: colors.gray100, marginLeft: spacing[4] + 22 + 18 },
  emptyText:    { textAlign: 'center', color: colors.gray400, paddingVertical: 20, fontSize: typography.base, fontFamily: 'Poppins-Regular' },
  footer:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.gray100 },
  clearBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  clearText:    { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray400, letterSpacing: 0.5 },
  applyBtn:     { flex: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, backgroundColor: colors.gray200 },
  applyText:    { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, letterSpacing: 0.5 } });
