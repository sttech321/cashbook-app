import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

export default function MoveBookRequestsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Received');

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Move Book Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.tabContainer}>
        <TouchableOpacity 
          style={[s.tabButton, activeTab === 'Received' && s.tabButtonActive]}
          onPress={() => setActiveTab('Received')}
        >
          <Text style={[s.tabText, activeTab === 'Received' && s.tabTextActive]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tabButton, activeTab === 'Sent' && s.tabButtonActive]}
          onPress={() => setActiveTab('Sent')}
        >
          <Text style={[s.tabText, activeTab === 'Sent' && s.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {activeTab === 'Received' ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No received requests found!</Text>
            <Text style={s.emptySubtitle}>
              If your employee members send a request to move a book from their business to this business then those will appear here
            </Text>
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No sent requests found!</Text>
            <Text style={s.emptySubtitle}>
              If you send a requests to move book from this business to another then those will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
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
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingHorizontal: spacing[4]
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabButtonActive: {
    borderBottomColor: colors.blue
  },
  tabText: {
    fontFamily: 'Poppins-Regular',
    fontSize: typography.sm,
    color: colors.gray500
  },
  tabTextActive: {
    fontFamily: 'Poppins-Medium',
    color: colors.blue
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  emptyState: {
    alignItems: 'center'
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.gray800,
    marginBottom: 8
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 16
  }
});
