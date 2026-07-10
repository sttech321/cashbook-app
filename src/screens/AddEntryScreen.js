import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addTransaction, getParties, createParty } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

const CATEGORY_IN  = ['Salary', 'Sale', 'Bonus', 'Income From Rent', 'Deposit', 'Profit'];
const CATEGORY_OUT = ['Food', 'Transport', 'Rent', 'Salary', 'Utilities', 'Shopping', 'Medical'];
const PAYMENT_MODES_PRIMARY  = ['Cash', 'Online'];
const PAYMENT_MODES_EXTENDED = ['PhonePe', 'Paytm', 'Google Pay', 'Bank Account', 'Net Banking', 'Debit Card', 'Credit Card'];

function pad(n) { return String(n).padStart(2, '0'); }

function formatDateDisplay(d) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function formatTimeDisplay(d) {
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// ── Category picker bottom sheet ─────────────────────────────────────────────

function CategorySheet({ visible, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={st.sheet}>
          <View style={st.sheetHandle} />
          <Text style={st.sheetTitle}>Select Category</Text>
          <View style={st.catChips}>
            {options.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[st.catChip, selected === cat && st.catChipActive]}
                onPress={() => { onSelect(cat); onClose(); }}
              >
                <Text style={[st.catChipText, selected === cat && st.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selected ? (
            <TouchableOpacity style={st.clearBtn} onPress={() => { onSelect(''); onClose(); }}>
              <Text style={st.clearBtnText}>Clear selection</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Party picker ─────────────────────────────────────────────────────────────

function PartyPickerModal({ visible, onClose, parties, onSelect, onAdd }) {
  const [search,   setSearch]   = useState('');
  const [newName,  setNewName]  = useState('');
  const [showForm, setShowForm] = useState(false);
  const [adding,   setAdding]   = useState(false);

  const filtered = parties.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const party = await onAdd(newName.trim());
      onSelect(party);
      setNewName('');
      setShowForm(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
        <View style={pm.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={pm.title}>Choose Party</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={22} color={colors.blue} />
          </TouchableOpacity>
        </View>
        <View style={pm.searchRow}>
          <Ionicons name="search" size={16} color={colors.blue} />
          <TextInput
            style={pm.searchInput}
            placeholder="Type to search and add"
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            filtered.length > 0
              ? <Text style={pm.listLabel}>Added Parties ({filtered.length})</Text>
              : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={pm.partyRow} onPress={() => onSelect(item)}>
              <View style={pm.avatar}>
                <Text style={pm.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pm.partyName}>{item.name}</Text>
                {(item.mobile || item.type)
                  ? <Text style={pm.partyMeta}>{[item.mobile, item.type].filter(Boolean).join(' · ')}</Text>
                  : null}
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <View>
              <View style={pm.sep} />
              <View style={pm.addRow}>
                <View style={pm.addCircle}><Ionicons name="add" size={18} color={colors.gray500} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={pm.addRowTitle}>Add New Party</Text>
                  <Text style={pm.addRowSub}>Add customers and suppliers</Text>
                </View>
              </View>
              {!showForm ? (
                <View style={pm.chipRow}>
                  <TouchableOpacity style={pm.chip} onPress={() => setShowForm(true)}>
                    <Text style={pm.chipText}>Enter Name &amp; Add</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={pm.addForm}>
                  <TextInput
                    style={pm.addInput}
                    placeholder="Party name"
                    placeholderTextColor={colors.gray400}
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[pm.addBtn, adding && { opacity: 0.6 }]}
                    onPress={handleAdd}
                    disabled={adding}
                  >
                    {adding
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={pm.addBtnText}>+ ADD NEW PARTY</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AddEntryScreen({ route, navigation }) {
  const { type, bookId } = route.params;
  const { currentBusinessId } = useApp();
  const isIN   = type === 'IN';
  const hColor = isIN ? colors.green : colors.red;

  const [amount,        setAmount]        = useState('');
  const [selectedParty, setParty]         = useState(null);
  const [remark,        setRemark]        = useState('');
  const [selectedCat,   setCat]           = useState('');
  const [selectedPay,   setPay]           = useState('');
  const [entryDate]                       = useState(new Date());
  const [parties,       setParties]       = useState([]);
  const [showParty,     setShowParty]     = useState(false);
  const [showCatSheet,  setShowCatSheet]  = useState(false);
  const [showMorePay,   setShowMorePay]   = useState(false);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    getParties(currentBusinessId, bookId)
      .then(d => setParties(d.parties || []))
      .catch(() => {});
  }, []);

  const handleAddParty = async (name) => {
    const data  = await createParty(currentBusinessId, bookId, { name });
    const party = data.party || { id: String(Date.now()), name };
    setParties(prev => [...prev, party]);
    return party;
  };

  const doSave = async (andNew = false) => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Required', 'Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await addTransaction(currentBusinessId, bookId, {
        type,
        amount:      amt,
        date:        entryDate.toISOString().split('T')[0],
        party:       selectedParty?.name || undefined,
        remarks:     remark.trim()       || undefined,
        category:    selectedCat         || undefined,
        paymentMode: selectedPay         || undefined });
      if (andNew) {
        setAmount(''); setParty(null); setRemark(''); setCat(''); setPay('');
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasAmount   = amount.length > 0;
  const allPayModes = [...PAYMENT_MODES_PRIMARY, ...(showMorePay ? PAYMENT_MODES_EXTENDED : [])];
  const categories  = isIN ? CATEGORY_IN : CATEGORY_OUT;

  return (
    <SafeAreaView style={a.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={a.header}>
        <TouchableOpacity style={a.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={hColor} />
        </TouchableOpacity>
        <Text style={[a.headerTitle, { color: hColor }]}>
          {isIN ? 'Add Cash In Entry' : 'Add Cash Out Entry'}
        </Text>
        <TouchableOpacity style={a.headerBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.blue} />
        </TouchableOpacity>
      </View>

      {/* ── Date & Time ── */}
      <View style={a.dateRow}>
        <TouchableOpacity style={a.dateChip}>
          <Ionicons name="calendar-outline" size={17} color={colors.gray600} />
          <Text style={a.dateText}>{formatDateDisplay(entryDate)}</Text>
          <Ionicons name="chevron-down" size={15} color={colors.gray500} />
        </TouchableOpacity>
        <View style={a.dateSep} />
        <TouchableOpacity style={a.dateChip}>
          <Ionicons name="time-outline" size={17} color={colors.gray600} />
          <Text style={a.dateText}>{formatTimeDisplay(entryDate)}</Text>
          <Ionicons name="chevron-down" size={15} color={colors.gray500} />
        </TouchableOpacity>
      </View>
      <View style={a.headerDivider} />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={a.scroll}>
        {/* ── Amount field ── */}
        <View style={a.amountBox}>
          <Text style={a.amountLabel}>Amount *</Text>
          <TextInput
            style={[a.amountInput, hasAmount && { color: isIN ? colors.green : colors.red }]}
            placeholder=""
            value={amount}
            onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* ── Extra fields (visible after amount entered) ── */}
        {hasAmount && (
          <>
            {/* Party */}
            <TouchableOpacity style={a.fieldRow} onPress={() => setShowParty(true)}>
              <Text style={[a.fieldPlaceholder, selectedParty && a.fieldValue]}>
                {selectedParty ? selectedParty.name : 'Party (Customer/Supplier)'}
              </Text>
              <Ionicons name="chevron-down" size={17} color={colors.gray400} />
            </TouchableOpacity>

            {/* Remark */}
            <View style={a.fieldRow}>
              <TextInput
                style={a.remarkInput}
                placeholder="Remark"
                placeholderTextColor={colors.gray400}
                value={remark}
                onChangeText={setRemark}
              />
              <Ionicons name="mic" size={20} color={colors.blue} />
            </View>

            {/* Attach */}
            <TouchableOpacity style={a.attachBtn}>
              <Ionicons name="attach" size={18} color={colors.blue} />
              <Text style={a.attachText}>Attach Image or PDF</Text>
            </TouchableOpacity>

            {/* Category */}
            <TouchableOpacity style={a.fieldRow} onPress={() => setShowCatSheet(true)}>
              <Text style={[a.fieldPlaceholder, selectedCat && a.fieldValue]}>
                {selectedCat || 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={17} color={colors.gray400} />
            </TouchableOpacity>

            {/* Payment Mode */}
            <View style={a.paySection}>
              <Text style={a.payLabel}>Payment Mode</Text>
              <View style={a.payChipRow}>
                {allPayModes.map(pm => (
                  <TouchableOpacity
                    key={pm}
                    style={[a.payChip, selectedPay === pm && a.payChipActive]}
                    onPress={() => setPay(selectedPay === pm ? '' : pm)}
                  >
                    <Text style={[a.payChipText, selectedPay === pm && a.payChipTextActive]}>{pm}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={a.showMoreBtn}
                  onPress={() => setShowMorePay(v => !v)}
                >
                  <Text style={a.showMoreText}>
                    {showMorePay ? 'Show Less' : 'Show More'}
                  </Text>
                  <Ionicons
                    name={showMorePay ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.blue}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Add More Fields */}
            <TouchableOpacity style={a.moreFieldsBtn}>
              <Text style={a.moreFieldsText}>Add More Fields</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={a.bottomBar}>
        <TouchableOpacity style={a.saveNewBtn} onPress={() => doSave(true)} disabled={saving}>
          <Text style={a.saveNewText}>SAVE &amp; ADD NEW</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[a.saveBtn, { backgroundColor: colors.blue }]}
          onPress={() => doSave(false)}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={a.saveBtnText}>SAVE</Text>}
        </TouchableOpacity>
      </View>

      <PartyPickerModal
        visible={showParty}
        onClose={() => setShowParty(false)}
        parties={parties}
        onSelect={p => { setParty(p); setShowParty(false); }}
        onAdd={handleAddParty}
      />

      <CategorySheet
        visible={showCatSheet}
        options={categories}
        selected={selectedCat}
        onSelect={setCat}
        onClose={() => setShowCatSheet(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const a = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 14 },
  headerBtn:    { width: 36, alignItems: 'flex-start' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: typography.xl, fontFamily: 'Poppins-Medium' },
  headerDivider:{ height: 1, backgroundColor: colors.gray100 },

  // Date/Time row
  dateRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12 },
  dateChip:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dateText:     { flex: 1, fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray800 },
  dateSep:      { width: 1, height: 20, backgroundColor: colors.gray200, marginHorizontal: 8 },

  // Scroll
  scroll:       { paddingBottom: 140 },

  // Amount box
  amountBox:    { marginHorizontal: spacing[4], marginTop: 20, marginBottom: 8, borderWidth: 1.5, borderColor: colors.blue, borderRadius: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  amountLabel:  { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.red, marginBottom: 6 },
  amountInput:  { fontSize: 28, fontFamily: 'Poppins-Medium', color: colors.gray900, padding: 0, minHeight: 40, ...(typeof document !== 'undefined' ? { outlineWidth: 0 } : {}) },

  // Field rows (Party, Remark, Category)
  fieldRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing[4], marginTop: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 16 },
  fieldPlaceholder: { flex: 1, fontSize: typography.md, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  fieldValue:   { color: colors.gray900, fontFamily: 'Poppins-Regular' },
  remarkInput:  { flex: 1, fontSize: typography.md, color: colors.gray900, padding: 0, fontFamily: 'Poppins-Regular' },

  // Attach
  attachBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing[4], marginTop: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, alignSelf: 'flex-start' },
  attachText:   { fontSize: typography.base, color: colors.blue, fontFamily: 'Poppins-Regular' },

  // Payment Mode
  paySection:   { marginHorizontal: spacing[4], marginTop: 18 },
  payLabel:     { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray700, marginBottom: 12 },
  payChipRow:   { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  payChip:      { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: '#fff' },
  payChipActive:{ backgroundColor: colors.blue, borderColor: colors.blue },
  payChipText:  { fontSize: typography.base, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  payChipTextActive: { color: '#fff', fontFamily: 'Poppins-Medium' },
  showMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  showMoreText: { fontSize: typography.base, color: colors.blue, fontFamily: 'Poppins-Medium' },

  // Add More Fields
  moreFieldsBtn:  { marginHorizontal: spacing[4], marginTop: 18, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingVertical: 14, alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 20 },
  moreFieldsText: { fontSize: typography.base, color: colors.blue, fontFamily: 'Poppins-Medium' },

  // Bottom bar
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 14, paddingBottom: 22, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100 },
  saveNewBtn:   { flex: 1, paddingVertical: 15, borderRadius: 10, borderWidth: 1.5, borderColor: colors.blue, alignItems: 'center' },
  saveNewText:  { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 0.6 },
  saveBtn:      { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: '#fff', letterSpacing: 0.6 } });

// ── Category sheet styles ─────────────────────────────────────────────────────

const st = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetHandle:    { width: 40, height: 4, backgroundColor: colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:     { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 18 },
  catChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: '#fff' },
  catChipActive:  { backgroundColor: colors.blueLight, borderColor: colors.blue },
  catChipText:    { fontSize: typography.base, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  catChipTextActive: { color: colors.blue, fontFamily: 'Poppins-Medium' },
  clearBtn:       { marginTop: 16, alignSelf: 'center' },
  clearBtnText:   { fontSize: typography.sm, color: colors.gray400, fontFamily: 'Poppins-Regular' } });

// ── Party modal styles ────────────────────────────────────────────────────────

const pm = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  title:      { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing[4], marginVertical: spacing[3], borderBottomWidth: 1.5, borderBottomColor: colors.blue, paddingBottom: 8 },
  searchInput:{ flex: 1, fontSize: typography.md, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  listLabel:  { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, paddingHorizontal: spacing[4], marginBottom: 6 },
  partyRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.xl },
  partyName:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  partyMeta:  { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  sep:        { height: 1, backgroundColor: colors.gray100, marginVertical: 8 },
  addRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 12 },
  addCircle:  { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  addRowTitle:{ fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  addRowSub:  { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing[4], marginBottom: 16 },
  chip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: colors.blueLight },
  chipText:   { fontSize: typography.sm, color: colors.blue, fontFamily: 'Poppins-Medium' },
  addForm:    { paddingHorizontal: spacing[4], gap: 12 },
  addInput:   { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.md, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  addBtn:     { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' } });
