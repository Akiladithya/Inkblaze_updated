// src/screens/HistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { getHistory, deleteHistoryItem, getHistoryItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, radius, shadows, IS_MOBILE } from '../styles/theme';

const DF = Platform.OS === 'web' ? { fontFamily: "'Cormorant Garamond', Georgia, serif" } : { fontFamily: 'Georgia' };

const fmt = (iso) => {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

export default function HistoryScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await getHistory()); }
    catch (e) { setError(e.message || 'Could not load history.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reload when navigating back to this screen
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const openItem = async (item) => {
    try {
      const full = await getHistoryItem(item.id);
      // Normalise pdf_path to relative uploads/xxx.pdf
      const rel = full.pdf_path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
      navigation.navigate('Home', {
        prefill: {
          highlightedText: full.highlighted_text,
          outputPdfPath:   rel,
          fileName:        full.original_name,
        },
      });
      // Navigate directly to Result
      navigation.navigate('Result', {
        highlightedText: full.highlighted_text,
        outputPdfPath:   rel,
        fileName:        full.original_name,
      });
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const removeItem = (item) => {
    const go = () =>
      deleteHistoryItem(item.id)
        .then(() => setItems(p => p.filter(i => i.id !== item.id)))
        .catch(e => Alert.alert('Error', e.message));

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${item.original_name}" from your library?`)) go();
    } else {
      Alert.alert('Remove document',
        `Remove "${item.original_name}" from your library?`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: go }]
      );
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity style={styles.row} onPress={() => openItem(item)} activeOpacity={0.75}>
      <Text style={styles.rowNum}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>{item.original_name}</Text>
        <Text style={styles.rowMeta}>{item.sentence_count} passages · {fmt(item.created_at)}</Text>
      </View>
      <TouchableOpacity style={styles.delBtn} onPress={() => removeItem(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.delBtnText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Text style={styles.headerSub}>{user?.name} · {user?.email}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.newBtnText}>New document</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rule} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centerText}>Loading your library…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptySub}>Upload your first document to begin building your library.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.startBtnText}>Analyse a document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listCount}>
              {items.length} document{items.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    alignItems: IS_MOBILE ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingTop: IS_MOBILE ? spacing.lg : spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    gap: IS_MOBILE ? spacing.sm : 0,
  },
  headerTitle: { fontSize: IS_MOBILE ? typography.xl : typography['2xl'], fontWeight: '600', color: colors.ink, ...DF },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  headerBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  newBtn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  newBtnText: { fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textInverse },
  signOutBtn: {
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderWidth: 1, borderColor: colors.border,
  },
  signOutText: { fontSize: typography.xs, fontWeight: typography.medium, color: colors.textSecondary },

  rule: { height: 1, backgroundColor: colors.border },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  centerText: { fontSize: typography.sm, color: colors.textMuted },
  errorText: { fontSize: typography.sm, color: colors.error, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: colors.borderMid, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },

  emptyTitle: { fontSize: IS_MOBILE ? typography.xl : typography['2xl'], fontWeight: '600', color: colors.ink, ...DF },
  emptySub: { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: typography.sm * 1.7, maxWidth: 300 },
  startBtn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    ...(Platform.OS === 'web' ? shadows.md : shadows.md),
  },
  startBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textInverse },

  list: {
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingTop: spacing.lg, paddingBottom: spacing['3xl'],
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
  listCount: {
    fontSize: typography.xs, color: colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase',
    fontWeight: typography.semibold, marginBottom: spacing.md,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 2, borderLeftColor: colors.gold,
    ...(Platform.OS === 'web' ? shadows.sm : shadows.sm),
  },
  rowNum: { fontSize: typography.xs, fontWeight: typography.bold, color: colors.gold, width: 24, letterSpacing: 0.5, ...DF },
  rowBody: { flex: 1 },
  rowName: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 2 },
  rowMeta: { fontSize: typography.xs, color: colors.textMuted },
  delBtn: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  delBtnText: { fontSize: 18, color: colors.textMuted, lineHeight: 22 },
});
