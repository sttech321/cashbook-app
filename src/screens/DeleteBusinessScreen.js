import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

import * as api from '../api';

export default function DeleteBusinessScreen({ navigation }) {
  const { currentBusiness, cashbooks, loadBusinesses, setCurrentBusinessId } = useApp();
  const [step, setStep] = useState(1);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const bizName = currentBusiness?.name || 'Business';

  const bookCount = cashbooks.length;
  const entriesCount = useMemo(() => {
    return cashbooks.reduce((sum, book) => sum + parseInt(book.transaction_count || 0, 10), 0);
  }, [cashbooks]);

  const handleFinalDelete = async () => {
    if (confirmName !== bizName) {
      Alert.alert('Error', `Please type '${bizName}' exactly to confirm.`);
      return;
    }
    
    setIsDeleting(true);
    try {
      await api.deleteBusiness(currentBusiness.id);
      await loadBusinesses();
      setCurrentBusinessId(null);
      navigation.navigate('DeleteSuccess');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete business');
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: step === 1 ? '#FCE8E8' : '#fff' }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => {
          if (step === 2) setStep(1);
          else navigation.goBack();
        }}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Delete {bizName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 1 ? (
        <View style={s.containerStep1}>
          <View style={s.warningIconContainer}>
            <Ionicons name="warning" size={48} color={colors.red} />
          </View>
          
          <Text style={s.title}>Are you sure?</Text>
          <Text style={s.subtitle}>
            This business will be deleted permanently. All the team members will lose access
          </Text>

          <View style={s.separator} />

          <Text style={s.deletingText}>You are deleting</Text>

          <View style={s.statsCard}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{bookCount}</Text>
              <Text style={s.statLabel}>{bookCount === 1 ? 'Book' : 'Books'}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{entriesCount}</Text>
              <Text style={s.statLabel}>{entriesCount === 1 ? 'Entry' : 'Entries'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView style={s.containerStep2} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.step2Subtitle}>
            Are you sure? <Text style={s.step2SubtitleNormal}>Please type </Text>
            '{bizName}' <Text style={s.step2SubtitleNormal}>to confirm</Text>
          </Text>

          <TextInput
            style={s.confirmInput}
            placeholder="Enter Business Name"
            placeholderTextColor={colors.gray400}
            value={confirmName}
            onChangeText={setConfirmName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={s.step2WarningBox}>
            <View style={s.step2WarningHeader}>
              <Ionicons name="warning" size={20} color={colors.red} />
              <Text style={s.step2WarningTitle}>
                {bookCount} {bookCount === 1 ? 'book' : 'books'} will be deleted
              </Text>
            </View>
            <View style={s.chipContainer}>
              {cashbooks.map(book => (
                <View key={book.id} style={s.bookChip}>
                  <Text style={s.bookChipText} numberOfLines={1}>{book.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {step === 1 ? (
        <View style={s.bottomContainer}>
          <TouchableOpacity style={s.continueBtn} onPress={() => setStep(2)}>
            <Text style={s.continueBtnText}>CONTINUE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={s.goBackBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.bottomContainer}>
          <TouchableOpacity 
            style={[s.deleteFinalBtn, (confirmName !== bizName || isDeleting) && s.deleteFinalBtnDisabled]} 
            onPress={handleFinalDelete}
            disabled={confirmName !== bizName || isDeleting}
          >
            <Ionicons name="trash-outline" size={18} color={(confirmName !== bizName || isDeleting) ? colors.gray400 : colors.gray600} />
            <Text style={[s.deleteFinalBtnText, (confirmName !== bizName || isDeleting) && s.deleteFinalBtnTextDisabled]}>
              {isDeleting ? 'DELETING...' : 'DELETE'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelFinalBtn} onPress={() => navigation.goBack()} disabled={isDeleting}>
            <Text style={s.cancelFinalBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    paddingHorizontal: spacing[2], 
    paddingVertical: 12,
  },
  backBtn: { padding: spacing[2] },
  pageTitle: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  
  // Step 1 Styles
  containerStep1: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  warningIconContainer: { marginBottom: 20 },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.lg,
    color: colors.gray900,
    marginBottom: 8
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16
  },
  separator: {
    width: 24,
    height: 3,
    backgroundColor: '#FCA5A5', 
    borderRadius: 2,
    marginVertical: 24
  },
  deletingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.gray800,
    marginBottom: 16
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    width: '100%',
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray100
  },
  statValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: colors.red,
    marginBottom: 4
  },
  statLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.gray800
  },

  // Step 2 Styles
  containerStep2: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  step2Subtitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.gray900,
    marginBottom: 20
  },
  step2SubtitleNormal: {
    fontFamily: 'Poppins-Regular',
    color: colors.gray700
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Poppins-Regular',
    fontSize: typography.sm,
    color: colors.gray900,
    marginBottom: 20
  },
  step2WarningBox: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: 16,
    backgroundColor: '#fff'
  },
  step2WarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  step2WarningTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.red
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  bookChip: {
    backgroundColor: '#FCE8E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    maxWidth: '100%'
  },
  bookChipText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: colors.gray700
  },

  // Bottom Action Styles
  bottomContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueBtnText: {
    color: colors.red,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5
  },
  goBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  goBackBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5
  },
  
  deleteFinalBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteFinalBtnDisabled: {
    opacity: 0.5
  },
  deleteFinalBtnText: {
    color: colors.gray700,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5
  },
  deleteFinalBtnTextDisabled: {
    color: colors.gray500
  },
  cancelFinalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelFinalBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5
  }
});
