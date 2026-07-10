import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updateTransaction, deleteTransaction, getParties, createParty } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

const CATEGORY_IN  = ['Salary', 'Sale', 'Bonus', 'Income From Rent', 'Deposit', 'Profit'];
const CATEGORY_OUT = ['Food', 'Transport', 'Rent', 'Salary', 'Utilities', 'Shopping', 'Medical'];
const PAYMENT_MODES = ['Cash', 'Online', 'PhonePe', 'Paytm', 'Google Pay', 'Bank Account', 'Net Banking', 'Debit Card', 'Credit Card'];

function pad(n) { return String(n).padStart(2,'0'); }

function formatDateDisplay(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}
function formatTimeDisplay(d) {
  let h = d.getHours(); const m = pad(d.getMinutes());
  const ampm = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// ── Leave page modal ──────────────────────────────────────────────────────────

function LeaveModal({ visible, onLeave, onStay }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStay}>
      <View style={lm.overlay}>
        <View style={lm.card}>
          <Text style={lm.title}>Leave this page?</Text>
          <Text style={lm.body}>Are you sure? Your changes won't be saved.</Text>
          <View style={lm.btnRow}>
            <TouchableOpacity style={lm.leaveBtn} onPress={onLeave}>
              <Text style={lm.leaveText}>LEAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={lm.stayBtn} onPress={onStay}>
              <Text style={lm.stayText}>STAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Category picker modal ─────────────────────────────────────────────────────

function CategoryModal({ visible, onClose, onSelect, options, selected }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={cm.sheet}>
          <View style={cm.header}>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.gray700} /></TouchableOpacity>
            <Text style={cm.title}>Select Category</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing[4], flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {options.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[cm.chip, selected === cat && cm.chipActive]}
                onPress={() => { onSelect(cat === selected ? '' : cat); onClose(); }}
              >
                <Text style={[cm.chipText, selected === cat && cm.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── EditEntryScreen ───────────────────────────────────────────────────────────

export default function EditEntryScreen({ route, navigation }) {
  const { transaction: tx, bookId, bookName } = route.params;
  const { currentBusinessId } = useApp();

  const initDate = new Date(tx.created_at || tx.date || Date.now());

  const [entryType,   setEntryType]   = useState(tx.type || 'IN');
  const [amount,      setAmount]      = useState(String(tx.amount || ''));
  const [partyName,   setPartyName]   = useState(tx.party || '');
  const [remark,      setRemark]      = useState(tx.remarks || '');
  const [selectedCat, setCat]         = useState(tx.category || '');
  const [selectedPay, setPay]         = useState(tx.paymentMode || '');
  const [entryDate]                   = useState(initDate);
  const [showMorePay, setShowMorePay] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [parties,     setParties]     = useState([]);

  // Leave page confirmation
  const [showLeaveModal, setShowLeaveModal]   = useState(false);
  const [pendingAction,  setPendingAction]    = useState(null);

  const isIN = entryType === 'IN';
  const hColor = isIN ? colors.green : colors.red;

  // Is form dirty (changed from original)?
  const isDirty =
    entryType !== tx.type ||
    amount !== String(tx.amount || '') ||
    partyName !== (tx.party || '') ||
    remark !== (tx.remarks || '') ||
    selectedCat !== (tx.category || '') ||
    selectedPay !== (tx.paymentMode || '');

  // Keep a ref so the beforeRemove listener always reads the latest value
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Intercept hardware-back / swipe gestures
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      setPendingAction(() => () => navigation.dispatch(e.data.action));
      setShowLeaveModal(true);
    });
    return unsub;
  }, [navigation]);

  // Header back button — show Leave modal when dirty, otherwise go back
  const handleBackPress = () => {
    if (isDirtyRef.current) {
      setPendingAction(() => () => navigation.goBack());
      setShowLeaveModal(true);
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    getParties(currentBusinessId, bookId)
      .then(d => setParties(d.parties || []))
      .catch(() => {});
  }, []);

  const handleLeave = () => {
    setShowLeaveModal(false);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
  };

  const handleUpdate = async () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Required', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await updateTransaction(currentBusinessId, bookId, tx.id, {
        type:        entryType,
        amount:      amt,
        date:        entryDate.toISOString().split('T')[0],
        party:       partyName.trim() || undefined,
        remarks:     remark.trim()    || undefined,
        category:    selectedCat      || undefined,
        paymentMode: selectedPay      || undefined });
      // Pop EditEntry and EntryDetail, reload TransactionView via useFocusEffect
      navigation.pop(2);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Entry will be deleted permanently. There is no way to recover.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(currentBusinessId, bookId, tx.id);
            navigation.pop(2); // pop EditEntry + EntryDetail
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        } },
    ]);
  };

  const categorySuggestions = isIN ? CATEGORY_IN : CATEGORY_OUT;
  const visiblePays = showMorePay ? PAYMENT_MODES : PAYMENT_MODES.slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={e.header}>
        <TouchableOpacity onPress={handleBackPress} style={e.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={e.headerTitle}>Edit Entry</Text>
        <TouchableOpacity style={e.iconBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={22} color={colors.red} />
        </TouchableOpacity>
      </View>

      {/* Cash In / Cash Out toggle */}
      <View style={e.typeRow}>
        <TouchableOpacity
          style={[e.typeBtn, entryType === 'IN' && e.typeBtnIN]}
          onPress={() => setEntryType('IN')}
        >
          <Text style={[e.typeBtnText, entryType === 'IN' && e.typeBtnTextActive]}>Cash In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[e.typeBtn, entryType === 'OUT' && e.typeBtnOUT]}
          onPress={() => setEntryType('OUT')}
        >
          <Text style={[e.typeBtnText, entryType === 'OUT' && e.typeBtnTextActive]}>Cash Out</Text>
        </TouchableOpacity>
      </View>

      {/* Date / Time */}
      <View style={e.dateRow}>
        <TouchableOpacity style={e.dateChip}>
          <Ionicons name="calendar-outline" size={16} color={colors.gray600} />
          <Text style={e.dateText}>{formatDateDisplay(entryDate)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.gray500} />
        </TouchableOpacity>
        <TouchableOpacity style={e.dateChip}>
          <Ionicons name="time-outline" size={16} color={colors.gray600} />
          <Text style={e.dateText}>{formatTimeDisplay(entryDate)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Amount */}
        <View style={[e.floatField, { borderColor: hColor }]}>
          <Text style={e.floatLabel}>Amount <Text style={{ color: colors.red }}>*</Text></Text>
          <TextInput
            style={[e.floatInput, { color: hColor }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder=""
            autoFocus={false}
          />
        </View>

        {/* Party */}
        <View style={e.floatField}>
          <Text style={e.floatLabel}>Party (Customer/Supplier)</Text>
          <View style={e.floatInputRow}>
            <TextInput
              style={[e.floatInput, { flex: 1, color: colors.gray900 }]}
              value={partyName}
              onChangeText={setPartyName}
              placeholder=""
            />
            {partyName.length > 0 && (
              <TouchableOpacity onPress={() => setPartyName('')}>
                <Ionicons name="close" size={20} color={colors.gray500} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SMS bill card — shown when party is entered */}
        {partyName.length > 0 && (
          <View style={e.smsCard}>
            <View style={e.smsTop}>
              <Ionicons name="receipt-outline" size={20} color={colors.green} />
              <Text style={e.smsTitle}>Send bill to {partyName} via free SMS</Text>
              <View style={[e.checkbox, e.checkboxActive]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            </View>
            <Text style={e.smsPreview}>
              Dear {partyName}, your bill is ready! Click on the link below to view: http://bills.cashbook.in/* - CashBook
            </Text>
          </View>
        )}

        {/* Remark */}
        <View style={e.remarkField}>
          <TextInput
            style={e.remarkInput}
            placeholder="Remark"
            placeholderTextColor={colors.gray400}
            value={remark}
            onChangeText={setRemark}
          />
          <Ionicons name="mic" size={20} color={colors.blue} />
        </View>

        {/* Attach */}
        <TouchableOpacity style={e.attachRow} onPress={() => Alert.alert('Attach', 'File attachment coming soon.')}>
          <Ionicons name="attach" size={18} color={colors.blue} />
          <Text style={e.attachText}>Attach Image or PDF</Text>
        </TouchableOpacity>

        {/* Category dropdown */}
        <TouchableOpacity style={[e.floatField, e.dropdownField]} onPress={() => setShowCatModal(true)}>
          <Text style={e.floatLabel}>Category</Text>
          <View style={e.floatInputRow}>
            <Text style={[e.floatInput, { flex: 1, color: selectedCat ? colors.gray900 : colors.gray400, paddingTop: 0 }]}>
              {selectedCat || ''}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray500} />
          </View>
        </TouchableOpacity>

        {/* Payment Mode */}
        <View style={e.paySection}>
          <Text style={e.payLabel}>Payment Mode</Text>
          <View style={e.payChips}>
            {visiblePays.map(pm => (
              <TouchableOpacity
                key={pm}
                style={[e.payChip, selectedPay === pm && e.payChipActive]}
                onPress={() => setPay(selectedPay === pm ? '' : pm)}
              >
                <Text style={[e.payChipText, selectedPay === pm && e.payChipTextActive]}>{pm}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={e.showMoreBtn} onPress={() => setShowMorePay(!showMorePay)}>
              <Text style={e.showMoreText}>Show {showMorePay ? 'Less' : 'More'}</Text>
              <Ionicons name={showMorePay ? 'chevron-up' : 'chevron-down'} size={13} color={colors.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add More Fields */}
        <TouchableOpacity style={e.addMoreBtn} onPress={() => Alert.alert('Add More Fields', 'Custom fields coming soon.')}>
          <Text style={e.addMoreText}>Add More Fields</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* UPDATE button */}
      <View style={e.bottomBar}>
        <TouchableOpacity
          style={[e.updateBtn, saving && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={e.updateText}>UPDATE</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Leave page modal */}
      <LeaveModal
        visible={showLeaveModal}
        onLeave={handleLeave}
        onStay={() => { setShowLeaveModal(false); setPendingAction(null); }}
      />

      {/* Category picker */}
      <CategoryModal
        visible={showCatModal}
        onClose={() => setShowCatModal(false)}
        options={categorySuggestions}
        selected={selectedCat}
        onSelect={(cat) => { setCat(cat); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const e = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  typeRow:        { flexDirection: 'row', gap: 12, paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2] },
  typeBtn:        { paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.gray100 },
  typeBtnIN:      { backgroundColor: colors.green },
  typeBtnOUT:     { backgroundColor: colors.red },
  typeBtnText:    { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray500 },
  typeBtnTextActive:{ color: '#fff', fontFamily: 'Poppins-Regular' },
  dateRow:        { flexDirection: 'row', gap: 12, paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  dateChip:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8 },
  dateText:       { flex: 1, fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  floatField:     { marginHorizontal: spacing[4], marginTop: spacing[4], borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, minHeight: 62 },
  dropdownField:  { justifyContent: 'center' },
  floatLabel:     { fontSize: typography.sm, color: colors.gray500, marginBottom: 4, fontFamily: 'Poppins-Regular' },
  floatInput:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', padding: 0 },
  floatInputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smsCard:        { marginHorizontal: spacing[4], marginTop: spacing[3], borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, padding: 12 },
  smsTop:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  smsTitle:       { flex: 1, fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  checkbox:       { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  smsPreview:     { fontSize: typography.xs, color: colors.gray500, lineHeight: 16, fontFamily: 'Poppins-Regular' },
  remarkField:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing[4], marginTop: spacing[3], borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 14, gap: 8 },
  remarkInput:    { flex: 1, fontSize: typography.md, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  attachRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing[4], marginTop: spacing[3], paddingVertical: 4 },
  attachText:     { fontSize: typography.md, color: colors.blue, fontFamily: 'Poppins-Regular' },
  paySection:     { marginHorizontal: spacing[4], marginTop: spacing[4] },
  payLabel:       { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, marginBottom: 10 },
  payChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  payChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.gray100 },
  payChipActive:  { backgroundColor: colors.blueLight, borderWidth: 1.5, borderColor: colors.blue },
  payChipText:    { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  payChipTextActive:{ color: colors.blue, fontFamily: 'Poppins-Medium' },
  showMoreBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 8 },
  showMoreText:   { fontSize: typography.sm, color: colors.blue, fontFamily: 'Poppins-Medium' },
  addMoreBtn:     { marginHorizontal: spacing[4], marginTop: spacing[4], paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.gray200, alignItems: 'center' },
  addMoreText:    { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue },
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100, padding: 12 },
  updateBtn:      { backgroundColor: colors.blue, borderRadius: radius.xl, paddingVertical: 18, alignItems: 'center' },
  updateText:     { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 } });

// ── Leave modal styles ────────────────────────────────────────────────────────

const lm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:      { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: 24, width: '100%', maxWidth: 400 },
  title:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 10 },
  body:      { fontSize: typography.base, color: colors.gray600, marginBottom: 28, fontFamily: 'Poppins-Regular' },
  btnRow:    { flexDirection: 'row', gap: 12 },
  leaveBtn:  { flex: 1, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.blue, alignItems: 'center' },
  leaveText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  stayBtn:   { flex: 1, paddingVertical: 14, borderRadius: radius.xl, backgroundColor: colors.blue, alignItems: 'center' },
  stayText:  { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 } });

// ── Category modal styles ─────────────────────────────────────────────────────

const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing[4], paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title:        { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  chip:         { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: '#fff' },
  chipActive:   { backgroundColor: colors.blueLight, borderColor: colors.blue },
  chipText:     { fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  chipTextActive:{ color: colors.blue, fontFamily: 'Poppins-Medium' } });
