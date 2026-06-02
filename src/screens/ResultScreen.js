// src/screens/ResultScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Platform,
} from 'react-native';
import DownloadButton from '../components/DownloadButton';
import PDFViewer from '../components/PDFViewer';
import { colors, typography, spacing, radius, shadows, IS_MOBILE } from '../styles/theme';

const ND = Platform.OS !== 'web';
const TAB_HIGHLIGHTS = 'highlights';
const TAB_PDF = 'pdf';

const displayFont = Platform.OS === 'web'
  ? { fontFamily: "'Cormorant Garamond', Georgia, serif" }
  : { fontFamily: 'Georgia' };

const ResultScreen = ({ route, navigation }) => {
  const { highlightedText, outputPdfPath, fileName } = route.params;
  const [activeTab, setActiveTab] = useState(TAB_HIGHLIGHTS);
  const [pdfVisible, setPdfVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: ND }).start();
  }, []);

  const sentences = highlightedText
    ? highlightedText.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0)
    : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('History')}>
          <Text style={styles.backBtnText}>← Library</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <View style={styles.donePill}>
            <Text style={styles.donePillText}>Complete</Text>
          </View>
        </View>
      </View>

      {/* File name */}
      <View style={styles.fileBar}>
        <Text style={styles.fileBarLabel}>INKBLAZE</Text>
        <Text style={styles.fileBarSep}>·</Text>
        <Text style={styles.fileBarName} numberOfLines={1}>{fileName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: TAB_HIGHLIGHTS, label: 'Key Passages' },
          { key: TAB_PDF,        label: 'Download' },
        ].map(t => (
          <TouchableOpacity key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {activeTab === TAB_HIGHLIGHTS ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Stats strip */}
            <View style={styles.statsStrip}>
              {[
                { value: sentences.length,                        label: 'passages' },
                { value: highlightedText?.split(' ').length || 0, label: 'words' },
                { value: 'TF-IDF',                                label: 'method' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.statsDivider} />}
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.sectionHeading}>Important passages</Text>
            <Text style={styles.sectionSub}>
              Ranked by statistical significance to the document as a whole
            </Text>

            {sentences.length > 0
              ? sentences.map((s, i) => <SentenceCard key={i} sentence={s} index={i} />)
              : <Text style={styles.emptyText}>No passages were extracted from this document.</Text>
            }
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.downloadCard}>
              <Text style={styles.downloadCardTitle}>Your document is ready</Text>
              <Text style={styles.downloadCardSub}>
                The original PDF with yellow highlight annotations and Gemini-generated comprehension questions appended on the final page.
              </Text>
              <View style={styles.downloadActions}>
                <DownloadButton outputPdfPath={outputPdfPath} />
                <TouchableOpacity style={styles.viewBtn} onPress={() => setPdfVisible(true)} activeOpacity={0.85}>
                  <Text style={styles.viewBtnText}>View inline</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pathRow}>
                <Text style={styles.pathText}>{outputPdfPath}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoHeading}>What's included</Text>
              {[
                ['01', 'Yellow highlight annotations on the most important sentences'],
                ['02', 'Multiple-choice questions generated by Gemini 2.5 Flash'],
                ['03', 'Original document layout and formatting fully preserved'],
              ].map(([n, text]) => (
                <View key={n} style={styles.infoRow}>
                  <Text style={styles.infoNum}>{n}</Text>
                  <Text style={styles.infoText}>{text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      <PDFViewer outputPdfPath={outputPdfPath} visible={pdfVisible} onClose={() => setPdfVisible(false)} />
    </View>
  );
};

const SentenceCard = ({ sentence, index }) => {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, delay: index * 35, useNativeDriver: ND }),
      Animated.timing(slide, { toValue: 0, duration: 300, delay: index * 35, useNativeDriver: ND }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.sentenceCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <Text style={styles.sentenceIndex}>{String(index + 1).padStart(2, '0')}</Text>
      <Text style={styles.sentenceText}>{sentence}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingTop: IS_MOBILE ? spacing.md : spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { paddingVertical: spacing.xs },
  backBtnText: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  headerRight: {},
  donePill: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  donePillText: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: colors.primary, letterSpacing: 0.5,
  },

  fileBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fileBarLabel: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.gold, letterSpacing: 2,
    ...displayFont,
  },
  fileBarSep: { color: colors.borderMid, fontSize: typography.sm },
  fileBarName: {
    fontSize: typography.xs, color: colors.textMuted,
    flex: 1, fontWeight: typography.medium,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
  },
  tab: {
    paddingVertical: spacing.md, marginRight: spacing.xl,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.ink },
  tabText: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.textMuted },
  tabTextActive: { color: colors.ink, fontWeight: typography.semibold },

  scroll: { flex: 1 },
  scrollContent: {
    padding: IS_MOBILE ? spacing.md : spacing.xl,
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },

  statsStrip: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.xl, alignItems: 'center',
    ...(Platform.OS === 'web' ? shadows.sm : shadows.sm),
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: typography.lg, fontWeight: '600', color: colors.primary,
    ...displayFont,
  },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  statsDivider: { width: 1, height: 28, backgroundColor: colors.border },

  sectionHeading: {
    fontSize: IS_MOBILE ? typography.xl : typography['2xl'],
    fontWeight: '600', color: colors.ink, marginBottom: 4,
    ...displayFont,
  },
  sectionSub: {
    fontSize: typography.sm, color: colors.textMuted,
    marginBottom: spacing.lg, lineHeight: typography.sm * 1.6,
  },

  sentenceCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 2, borderLeftColor: colors.gold,
    ...(Platform.OS === 'web' ? shadows.sm : shadows.sm),
  },
  sentenceIndex: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.gold, width: 22, marginTop: 2, flexShrink: 0,
    letterSpacing: 0.5, ...displayFont,
  },
  sentenceText: {
    flex: 1, fontSize: typography.sm, color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed,
  },
  emptyText: {
    color: colors.textMuted, fontSize: typography.base,
    textAlign: 'center', paddingVertical: spacing['2xl'],
  },

  downloadCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: IS_MOBILE ? spacing.lg : spacing.xl,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web' ? shadows.md : shadows.md),
  },
  downloadCardTitle: {
    fontSize: IS_MOBILE ? typography.xl : typography['2xl'],
    fontWeight: '600', color: colors.ink, marginBottom: spacing.sm,
    ...displayFont,
  },
  downloadCardSub: {
    fontSize: typography.sm, color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed, marginBottom: spacing.lg,
  },
  downloadActions: { gap: spacing.sm, marginBottom: spacing.md },
  viewBtn: {
    backgroundColor: colors.backgroundAlt, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  viewBtnText: {
    fontSize: typography.base, fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  pathRow: {
    backgroundColor: colors.backgroundAlt, borderRadius: radius.sm,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  pathText: {
    fontSize: typography.xs, color: colors.textMuted,
    ...(Platform.OS === 'web' ? { fontFamily: "'JetBrains Mono', monospace" } : { fontFamily: 'Courier New' }),
  },

  infoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    ...(Platform.OS === 'web' ? shadows.sm : shadows.sm),
  },
  infoHeading: {
    fontSize: typography.base, fontWeight: typography.semibold,
    color: colors.ink, marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row', gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoNum: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.gold, width: 22, letterSpacing: 0.5,
    ...displayFont,
  },
  infoText: {
    flex: 1, fontSize: typography.sm, color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed,
  },
});

export default ResultScreen;
