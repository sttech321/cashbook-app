import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, Modal, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { updateMe as updateProfile, sendOtp, verifyOtp } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [mobileStep, setMobileStep] = useState(1); // 1 = info, 2 = inputs, 3 = otp
  const [showEmail, setShowEmail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit Profile State
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [oldMobile, setOldMobile] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(26);
  const [errorPopup, setErrorPopup] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (mobileStep === 3 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mobileStep, timer]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim() });
      updateUser(updated.user || { ...user, name: name.trim() });
      setShowEdit(false);
    }
    catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Name Input / Display */}
        <TouchableOpacity style={s.floatingInputContainer} onPress={() => setShowEdit(true)}>
          <Text style={s.floatingLabel}>Your Full Name</Text>
          <Text style={[s.floatingInput, !user?.name && { color: colors.gray400 }]}>
            {user?.name || 'Enter your name'}
          </Text>
        </TouchableOpacity>

        {/* Mobile Number Row */}
        <View style={s.rowCard}>
          <View style={s.rowInfo}>
            <Text style={s.rowLabel}>Mobile Number</Text>
            <Text style={s.rowValue}>{user?.mobile || '+91'}</Text>
          </View>
          <TouchableOpacity onPress={() => { setMobileStep(user?.mobile ? 1 : 2); setShowMobile(true); }}>
            <Text style={s.actionText}>CHANGE</Text>
          </TouchableOpacity>
        </View>

        {/* Email Row */}
        <View style={[s.rowCard, { borderBottomWidth: 0, marginTop: 16 }]}>
          <View style={s.rowInfo}>
            <Text style={s.rowLabel}>{user?.email ? 'Email Address' : 'Add Your Email Address'}</Text>
            {!!user?.email && <Text style={s.rowValue}>{user.email}</Text>}
          </View>
          <TouchableOpacity onPress={() => setShowEmail(true)}>
            <Text style={s.actionText}>{user?.email ? 'CHANGE' : 'ADD'}</Text>
          </TouchableOpacity>
        </View>

        {/* Email Benefits Card */}
        {!user?.email && (
          <View style={s.benefitsCard}>
            <View style={s.benefitsHeader}>
              <View style={s.emailIconBox}>
                <Ionicons name="mail" size={24} color="#FBBF24" />
                <View style={s.plusBadge}><Ionicons name="add" size={12} color="#fff" /></View>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={s.benefitsTitle}>Benefits of adding email</Text>

                <View style={s.bulletRow}>
                  <View style={s.bullet} />
                  <Text style={s.bulletText}>Login via verified email on desktop</Text>
                </View>

                <View style={s.bulletRow}>
                  <View style={s.bullet} />
                  <Text style={s.bulletText}>Get monthly summary on email</Text>
                </View>
                <Text style={s.comingSoon}>(Coming soon)</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ marginTop: 40 }}>
          <TouchableOpacity style={s.dangerBtn} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.red} />
            <Text style={s.dangerBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Name Modal (Bottom Sheet) */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
          <TouchableOpacity activeOpacity={1} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Edit Profile</Text>
            <View style={s.floatingInputContainer}>
              <Text style={s.floatingLabel}>Full Name</Text>
              <TextInput
                style={s.floatingInputReal}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>
            <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={handleSaveName} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Save</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Change Mobile Modal */}
      <Modal visible={showMobile} animationType="slide" onRequestClose={() => setShowMobile(false)}>
        <SafeAreaView style={s.modalContainer}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => (user?.mobile && mobileStep === 2) ? setMobileStep(1) : setShowMobile(false)} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{user?.mobile ? 'Change Mobile Number' : 'Add Mobile Number'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {mobileStep === 1 ? (
            <View style={s.mobileStep1}>
              <View style={s.simGraphic}>
                <Ionicons name="phone-portrait-outline" size={60} color={colors.blue} />
                <Ionicons name="arrow-forward" size={30} color={colors.gray400} style={{ marginHorizontal: 10 }} />
                <Ionicons name="phone-portrait-outline" size={60} color={colors.green} />
              </View>

              <Text style={s.simTitle}>Changing mobile number will transfer all your data from old number to new number</Text>

              <View style={s.simBulletRow}>
                <View style={s.simBullet} />
                <Text style={s.simBulletText}>Your data is linked to your mobile number</Text>
              </View>
              <View style={s.simBulletRow}>
                <View style={s.simBullet} />
                <Text style={s.simBulletText}>You will need to use your new number for login to see your data after you change your number</Text>
              </View>
              <View style={s.simBulletRow}>
                <View style={s.simBullet} />
                <Text style={s.simBulletText}>Make sure that you are able to receive SMS at your new number</Text>
              </View>

              <View style={s.bottomFixed}>
                <TouchableOpacity style={s.btn} onPress={() => setMobileStep(2)}>
                  <Text style={s.btnText}>NEXT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : mobileStep === 2 ? (
            <View style={s.mobileStep2}>
              {!!user?.mobile && (
                <>
                  <Text style={s.inputHeaderLabel}>Enter your old mobile number</Text>
                  <View style={s.phoneRow}>
                    <View style={s.phoneCode}>
                      <Text style={s.phoneCodeLabel}>Code</Text>
                      <Text style={s.phoneCodeText}>+ 91</Text>
                      <Ionicons name="caret-down" size={14} color={colors.gray900} />
                    </View>
                    <View style={[s.phoneInputBox, oldMobile.length > 0 && { borderColor: colors.blue }]}>
                      <Text style={[s.phoneInputLabel, oldMobile.length > 0 && { color: colors.blue }]}>Mobile Number</Text>
                      <TextInput
                        style={s.phoneInputReal}
                        keyboardType="number-pad"
                        value={oldMobile}
                        onChangeText={setOldMobile}
                        maxLength={10}
                        autoFocus
                      />
                    </View>
                  </View>
                  <Text style={[s.inputHeaderLabel, { marginTop: 32 }]}>Enter your new mobile number</Text>
                </>
              )}
              
              {!user?.mobile && (
                <Text style={s.inputHeaderLabel}>Enter your mobile number</Text>
              )}
              <View style={s.phoneRow}>
                <View style={s.phoneCode}>
                  <Text style={s.phoneCodeLabel}>Code</Text>
                  <Text style={s.phoneCodeText}>+ 91</Text>
                  <Ionicons name="caret-down" size={14} color={colors.gray900} />
                </View>
                <View style={[s.phoneInputBox, newMobile.length > 0 && { borderColor: colors.blue }]}>
                  <Text style={[s.phoneInputLabel, newMobile.length > 0 && { color: colors.blue }]}>Mobile Number</Text>
                  <TextInput
                    style={s.phoneInputReal}
                    keyboardType="number-pad"
                    value={newMobile}
                    onChangeText={setNewMobile}
                    maxLength={10}
                    autoFocus={!user?.mobile}
                  />
                </View>
              </View>

              <View style={s.bottomFixed}>
                <TouchableOpacity
                  style={[s.btn, ((!!user?.mobile && !oldMobile) || !newMobile || otpLoading) && { backgroundColor: '#d5d5d5' }]}
                  disabled={(!!user?.mobile && !oldMobile) || !newMobile || otpLoading}
                  onPress={async () => {
                    if (user?.mobile) {
                      let currentMobileDigits = String(user.mobile).replace(/\D/g, '').slice(-10);
                      if (oldMobile !== currentMobileDigits) {
                        setErrorPopup('The old mobile number you entered is incorrect.');
                        return;
                      }
                      setShowConfirm(true);
                    } else {
                      try {
                        setOtpLoading(true);
                        const res = await sendOtp({ mobile: `+91${newMobile}` });
                        setOtpLoading(false);
                        setMobileStep(3);
                        if (res && res._demo_otp) {
                          setTimeout(() => Alert.alert('📱 Demo SMS', `Your Cashbook verification OTP is: ${res._demo_otp}`), 500);
                        }
                      } catch (err) {
                        setOtpLoading(false);
                        setErrorPopup(err.message || 'Failed to send OTP');
                      }
                    }
                  }}
                >
                  {otpLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[s.btnText, ((!!user?.mobile && !oldMobile) || !newMobile) && { color: '#888' }]}>NEXT</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.mobileStep2}>
              <Text style={s.otpSentText}>OTP sent to +91{newMobile}</Text>
              <Text style={s.otpSubText}>Enter 6 digit OTP below</Text>

              <View style={s.otpContainer}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    style={[s.otpInput, digit && s.otpInputFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(v) => {
                      const newOtp = [...otp];
                      newOtp[idx] = v;
                      setOtp(newOtp);
                      if (v && idx < 5) {
                        otpRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                        const newOtp = [...otp];
                        newOtp[idx - 1] = '';
                        setOtp(newOtp);
                      }
                    }}
                  />
                ))}
              </View>

              <Text style={s.resendText}>
                {timer > 0 ? (
                  <>Resend OTP in <Text style={{ fontFamily: 'Poppins-SemiBold', color: colors.gray900 }}>{timer} secs</Text> via</>
                ) : (
                  <Text onPress={() => setTimer(26)} style={{ color: colors.blue, fontFamily: 'Poppins-SemiBold' }}>Resend OTP now</Text>
                )}
              </Text>

              <View style={s.bottomFixed}>
                <TouchableOpacity
                  style={[s.btn, (otp.join('').length < 6 || otpLoading) && { backgroundColor: '#d5d5d5' }]}
                  disabled={otp.join('').length < 6 || otpLoading}
                  onPress={async () => {
                    try {
                      setOtpLoading(true);
                      await verifyOtp({ mobile: `+91${newMobile}`, otp: otp.join('') });
                      setOtpLoading(false);
                      
                      Alert.alert('Success', 'Successfully updated mobile number');
                      setShowMobile(false);
                      setMobileStep(1);
                      setOldMobile('');
                      setNewMobile('');
                      setOtp(['', '', '', '', '', '']);
                      if (user) updateUser({ ...user, mobile: `+91${newMobile}` });
                    } catch (err) {
                      setOtpLoading(false);
                      setErrorPopup(err.message || 'Invalid OTP');
                    }
                  }}
                >
                  {otpLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[s.btnText, otp.join('').length < 6 && { color: '#888' }]}>NEXT</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Email Modal */}
      <Modal visible={showEmail} animationType="slide" onRequestClose={() => setShowEmail(false)}>
        <SafeAreaView style={s.modalContainer}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowEmail(false)} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Add Email Address</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.emailBody}>
            <Text style={s.emailSubtitle}>You can login with this email after verification.</Text>

            <TouchableOpacity style={s.emailOptionBtn}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={s.emailOptionText}>CONTINUE WITH GOOGLE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.emailOptionBtn}>
              <Ionicons name="mail-outline" size={20} color={colors.blue} />
              <Text style={s.emailOptionText}>CONTINUE WITH EMAIL</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={s.overlayCenter}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>Change Mobile Number?</Text>
            <Text style={s.confirmText}>Changing number will transfer all your data from old to new number. OTP will be sent to your new number</Text>
            <View style={s.confirmPhones}>
              <View style={{ flex: 1 }}>
                <Text style={s.confirmPhoneLabel}>From</Text>
                <Text style={s.confirmPhoneValue}>+91{oldMobile}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.confirmPhoneLabel}>To</Text>
                <Text style={s.confirmPhoneValue}>+91{newMobile}</Text>
              </View>
            </View>
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.confirmBtnOutline} onPress={() => setShowConfirm(false)}>
                <Text style={s.confirmBtnOutlineText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtnSolid} onPress={async () => { 
                try {
                  setShowConfirm(false);
                  setOtpLoading(true);
                  const res = await sendOtp({ mobile: `+91${newMobile}` });
                  setOtpLoading(false);
                  setMobileStep(3); 
                  if (res && res._demo_otp) {
                    setTimeout(() => Alert.alert('📱 Demo SMS', `Your Cashbook verification OTP is: ${res._demo_otp}`), 500);
                  }
                } catch (err) {
                  setOtpLoading(false);
                  setErrorPopup(err.message || 'Failed to send OTP');
                }
              }}>
                <Text style={s.confirmBtnSolidText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Popup Modal */}
      <Modal visible={!!errorPopup} transparent animationType="fade" onRequestClose={() => setErrorPopup('')}>
        <View style={s.overlayCenter}>
          <View style={[s.confirmBox, { alignItems: 'center', paddingVertical: 32 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="alert-circle" size={32} color={colors.red} style={{ marginRight: 8 }} />
              <Text style={[s.confirmTitle, { marginBottom: 0 }]}>Error</Text>
            </View>
            <Text style={[s.confirmText, { textAlign: 'center', marginBottom: 24 }]}>{errorPopup}</Text>
            <TouchableOpacity style={[s.confirmBtnSolid, { width: '100%' }]} onPress={() => setErrorPopup('')}>
              <Text style={s.confirmBtnSolidText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  scroll: { padding: spacing[4] },

  floatingInputContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 16, marginTop: 16, marginBottom: 24, position: 'relative' },
  floatingLabel: { position: 'absolute', top: -10, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: typography.xs, color: '#b0b0b0', fontFamily: 'Poppins-Regular' },
  floatingInput: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  floatingInputReal: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900, padding: 0 },

  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular', marginBottom: 4 },
  rowValue: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  actionText: { color: colors.blue, fontFamily: 'Poppins-SemiBold', fontSize: typography.sm, letterSpacing: 0.5 },

  benefitsCard: { backgroundColor: '#f9f9f9', borderRadius: radius.md, padding: 16, marginTop: 12 },
  benefitsHeader: { flexDirection: 'row' },
  emailIconBox: { width: 40, height: 40, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  plusBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#34D399', borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f9f9f9' },
  benefitsTitle: { fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', color: colors.gray800, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginTop: 6, marginRight: 8 },
  bulletText: { fontSize: typography.xs, color: colors.gray600, fontFamily: 'Poppins-Medium', flex: 1, lineHeight: 18 },
  comingSoon: { fontSize: 10, color: colors.blue, fontFamily: 'Poppins-Medium', marginLeft: 14, marginTop: -4 },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.lg, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', paddingVertical: 14 },
  dangerBtnText: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.red },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 20 },

  btn: { backgroundColor: colors.blue, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },

  modalContainer: { flex: 1, backgroundColor: '#fff' },

  mobileStep1: { padding: spacing[6], flex: 1, backgroundColor: '#fff' },
  simGraphic: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  simTitle: { fontSize: typography.base, fontFamily: 'Poppins-SemiBold', color: colors.gray900, textAlign: 'center', marginBottom: 32 },
  simBulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  simBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray400, marginTop: 8, marginRight: 12 },
  simBulletText: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular', flex: 1, lineHeight: 22 },
  bottomFixed: { position: 'absolute', bottom: spacing[4], left: spacing[4], right: spacing[4] },

  mobileStep2: { padding: spacing[4], flex: 1, backgroundColor: '#fff' },
  inputHeaderLabel: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular', marginBottom: 12 },
  phoneRow: { flexDirection: 'row', gap: 12 },
  phoneCode: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  phoneCodeLabel: { position: 'absolute', top: -8, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 10, color: '#b0b0b0', fontFamily: 'Poppins-Regular' },
  phoneCodeText: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900, marginRight: 8 },
  phoneInputBox: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12, position: 'relative' },
  phoneInputLabel: { position: 'absolute', top: -8, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 10, color: '#b0b0b0', fontFamily: 'Poppins-Regular' },
  phoneInputReal: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900, padding: 0, margin: 0, height: 24 },

  emailBody: { padding: spacing[4], flex: 1, backgroundColor: '#f9f9f9' },
  emailSubtitle: { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular', marginBottom: 32 },
  emailOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: radius.sm, paddingVertical: 16, marginBottom: 16 },
  emailOptionText: { fontSize: typography.xs, color: colors.blue, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },

  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: spacing[4] },
  confirmBox: { backgroundColor: '#fff', borderRadius: radius.md, padding: spacing[5] },
  confirmTitle: { fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900, marginBottom: 8 },
  confirmText: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular', lineHeight: 20, marginBottom: 16 },
  confirmPhones: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 12, borderRadius: radius.sm, marginBottom: 24 },
  confirmPhoneLabel: { fontSize: 10, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  confirmPhoneValue: { fontSize: typography.xs, color: colors.gray900, fontFamily: 'Poppins-SemiBold' },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.blue, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  confirmBtnOutlineText: { color: colors.blue, fontFamily: 'Poppins-SemiBold', fontSize: typography.sm },
  confirmBtnSolid: { flex: 1, backgroundColor: colors.blue, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  confirmBtnSolidText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: typography.sm },

  otpSentText: { fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', color: colors.gray900, marginBottom: 4 },
  otpSubText: { fontSize: 10, color: colors.gray500, fontFamily: 'Poppins-Regular', marginBottom: 32 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 16 },
  otpInput: { width: 32, height: 40, borderBottomWidth: 1.5, borderBottomColor: colors.gray400, textAlign: 'center', fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900, padding: 0 },
  otpInputFilled: { borderBottomColor: colors.blue },
  resendText: { fontSize: 10, color: colors.gray500, fontFamily: 'Poppins-Regular' }
});
