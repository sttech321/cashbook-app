import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

export default function ExcelReportScreen({ navigation, route }) {
  const { bookName } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Excel Report</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Generate Excel Report for {bookName}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: typography.base, color: colors.gray600, fontFamily: 'Poppins-Regular' }
});
