// src/screens/ResultScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import DownloadButton from '../components/DownloadButton';
import PDFViewer from '../components/PDFViewer';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const TAB_HIGHLIGHTS = 'highlights';
const TAB_PDF = 'pdf';

const ResultScreen = ({ route, navigation }) => {
  const { highlightedText, outputPdfPath, fileName } = route.params;

  const [activeTab, setActiveTab] = useState(TAB_HIGHLIGHTS);
  const [pdfVisible, setPdfVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Split highlighted text into paragraphs / sentences for display
  const sentences = highlightedText
    ? highlightedText
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const handleNewDocument = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleNewDocument}>
          <Text style={styles.backBtnText}>← New</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Results</Text>
          <Text style={styles.headerFile} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>✓</Text>
        </View>
      </Animated.View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === TAB_HIGHLIGHTS && styles.tabActive]}
          onPress={() => setActiveTab(TAB_HIGHLIGHTS)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TAB_HIGHLIGHTS && styles.tabTextActive,
            ]}
          >
            ✏️  Highlights
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === TAB_PDF && styles.tabActive]}
          onPress={() => setActiveTab(TAB_PDF)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TAB_PDF && styles.tabTextActive,
            ]}
          >
            📄  PDF Actions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim }]}
      >
        {activeTab === TAB_HIGHLIGHTS ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats bar */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{sentences.length}</Text>
                <Text style={styles.statLabel}>Key Sentences</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>
                  {highlightedText?.split(' ').length || 0}
                </Text>
                <Text style={styles.statLabel}>Words Extracted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>TF-IDF</Text>
                <Text style={styles.statLabel}>Scoring Method</Text>
              </View>
            </View>

            {/* Highlighted sentences */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Highlighted Sentences</Text>
              <Text style={styles.sectionSub}>
                Top-ranked sentences from your document
              </Text>
            </View>

            {sentences.length > 0 ? (
              sentences.map((sentence, i) => (
                <SentenceCard key={i} sentence={sentence} index={i} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>
                  No highlighted text returned
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* PDF Actions card */}
            <View style={styles.actionsCard}>
              <View style={styles.actionsIcon}>
                <Text style={styles.actionsIconText}>📎</Text>
              </View>
              <Text style={styles.actionsTitle}>Highlighted PDF Ready</Text>
              <Text style={styles.actionsSubtitle}>
                Your document has been processed with highlights and AI-generated
                MCQs appended as the final page.
              </Text>

              <View style={styles.actionsBtnGroup}>
                {/* Download */}
                <DownloadButton outputPdfPath={outputPdfPath} />

                {/* View inline */}
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => setPdfVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewBtnText}>👁  View PDF</Text>
                </TouchableOpacity>

                {/* Generate standalone MCQs */}
                <TouchableOpacity
                  style={styles.mcqBtn}
                  onPress={() => navigation.navigate('MCQ')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mcqBtnText}>📝  Generate More MCQs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pdfMetaRow}>
                <View style={styles.pdfMetaItem}>
                  <Text style={styles.pdfMetaIcon}>📂</Text>
                  <Text style={styles.pdfMetaText}>{outputPdfPath}</Text>
                </View>
              </View>
            </View>

            {/* Info block */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>What's in the PDF?</Text>
              {[
                {
                  icon: '🟡',
                  text: 'Sentences highlighted based on TF-IDF importance score',
                },
                {
                  icon: '📝',
                  text: 'Multiple-choice questions generated by Mistral AI on the final page',
                },
                {
                  icon: '🗺️',
                  text: 'Original layout and formatting preserved throughout',
                },
              ].map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <Text style={styles.infoText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* PDF Modal Viewer */}
      <PDFViewer
        outputPdfPath={outputPdfPath}
        visible={pdfVisible}
        onClose={() => setPdfVisible(false)}
      />
    </View>
  );
};

// Sentence card sub-component
const SentenceCard = ({ sentence, index }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sentenceCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sentenceIndex}>
        <Text style={styles.sentenceIndexText}>{index + 1}</Text>
      </View>
      <Text style={styles.sentenceText}>{sentence}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.extrabold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  headerFile: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  successBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadgeText: {
    color: colors.textInverse,
    fontWeight: typography.bold,
    fontSize: 16,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.semibold,
  },

  // Content
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: typography.md,
    fontWeight: typography.extrabold,
    color: colors.primary,
    fontFamily: 'Georgia',
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },

  // Section header
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  sectionSub: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Sentence cards
  sentenceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    ...shadows.sm,
  },
  sentenceIndex: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  sentenceIndexText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.warning,
  },
  sentenceText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
    lineHeight: typography.sm * typography.relaxed,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: typography.base },

  // PDF Actions tab
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  actionsIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actionsIconText: { fontSize: 36 },
  actionsTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionsSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sm * typography.relaxed,
    marginBottom: spacing.xl,
  },
  actionsBtnGroup: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  viewBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  mcqBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  mcqBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warning,
  },
  pdfMetaRow: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  pdfMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pdfMetaIcon: { fontSize: 14 },
  pdfMetaText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontFamily: 'Courier New',
    flex: 1,
  },

  // Info block
  infoBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed,
  },
});

export default ResultScreen;
