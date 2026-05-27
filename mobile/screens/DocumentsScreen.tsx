import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {colors, typography} from '../theme';

export default function DocumentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.icon}>📄</Text>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.sub}>PDFs, itineraries and confirmations will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bgBase},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  icon: {fontSize: 40, marginBottom: 12},
  title: {fontSize: typography['2xl'], fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 8},
  sub: {fontSize: typography.base, color: colors.textSecondary, textAlign: 'center'},
});
