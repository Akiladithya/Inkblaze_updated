// src/screens/HomeScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, StatusBar, KeyboardAvoidingView,
} from 'react-native';
import UploadCard from '../components/UploadCard';
import { setFile } from '../utils/fileStore';
import { colors, typography, spacing, radius, shadows, IS_MOBILE } from '../styles/theme';

const ND = Platform.OS !== 'web';

const HomeScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleFileSelected = (file) => { setSelectedFile(file); setError(''); };
  const onPressIn = () => Animated.spring(ctaScale, { toValue: 0.98, useNativeDriver: ND }).start();
  const onPressOut = () => Animated.spring(ctaScale, { toValue: 1, useNativeDriver: ND }).start();

  const handleSubmit = () => {
    if (!selectedFile) { setError('Please select a PDF or DOCX file first.'); return; }
    setError('');
    setFile(selectedFile);
    navigation.navigate('Processing', { fileName: selectedFile.name, fileSize: selectedFile.size });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top nav */}
        <View style={styles.nav}>
          <Text style={styles.navWordmark}>INKBLAZE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.navLibrary}>My Library</Text>
          </TouchableOpacity>
        </View>

        {/* Rule */}
        <View style={styles.rule} />

        {/* Proverb */}
        <View style={styles.proverbBlock}>
          <Text style={styles.proverbMark}>"</Text>
          <Text style={styles.proverbText}>
            The art of being wise is knowing what to overlook.
          </Text>
          <Text style={styles.proverbAuthor}>— William James</Text>
        </View>

        {/* Rule */}
        <View style={styles.rule} />

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Surface what matters.</Text>
          <Text style={styles.heroSubtitle}>
            Upload any PDF or DOCX. INNK identifies the most important sentences using TF-IDF analysis, highlights them in your document, and generates comprehension questions — all returned as a single polished PDF.
          </Text>
        </View>

        {/* Capabilities */}
        <View style={styles.capRow}>
          {[
            { title: 'Statistical ranking', body: 'TF-IDF scores every sentence by relevance to the whole document.' },
            { title: 'In-document highlights', body: 'Yellow annotations placed directly on the original PDF layout.' },
            { title: 'AI comprehension', body: 'Gemini 2.5 Flash generates targeted multiple-choice questions.' },
          ].map((c, i) => (
            <View key={i} style={styles.capItem}>
              <View style={styles.capIndex}>
                <Text style={styles.capIndexText}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.capBody}>
                <Text style={styles.capTitle}>{c.title}</Text>
                <Text style={styles.capText}>{c.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Upload section */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Select your document</Text>
          <UploadCard onFileSelected={handleFileSelected} selectedFile={selectedFile} />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.ctaBtn, !selectedFile && styles.ctaBtnDisabled]}
            onPress={handleSubmit} onPressIn={onPressIn} onPressOut={onPressOut}
            activeOpacity={0.88} disabled={!selectedFile}
          >
            <Text style={[styles.ctaText, !selectedFile && styles.ctaTextDisabled]}>
              Analyse Document
            </Text>
            {selectedFile && <Text style={styles.ctaArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerNote}>
          Processed on your local server · no data leaves your machine
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const displayFont = Platform.OS === 'web'
  ? { fontFamily: typography.fontDisplay }
  : { fontFamily: 'Georgia' };

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingTop: IS_MOBILE ? spacing.lg : spacing.xl,
    paddingBottom: spacing['3xl'],
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  navWordmark: {
    fontSize: IS_MOBILE ? typography.md : typography.lg,
    fontWeight: typography.bold,
    color: colors.ink, letterSpacing: 5,
    ...displayFont,
  },
  navLibrary: {
    fontSize: typography.xs, color: colors.primary,
    fontWeight: typography.semibold, letterSpacing: 0.5,
  },

  rule: { height: 1, backgroundColor: colors.border, marginBottom: spacing.lg },

  // Proverb
  proverbBlock: {
    paddingVertical: IS_MOBILE ? spacing.lg : spacing.xl,
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.lg,
    marginBottom: spacing.lg,
  },
  proverbMark: {
    fontSize: IS_MOBILE ? 48 : 72,
    color: colors.gold,
    lineHeight: IS_MOBILE ? 36 : 52,
    marginBottom: spacing.sm,
    ...displayFont,
  },
  proverbText: {
    fontSize: IS_MOBILE ? typography.xl : typography['2xl'],
    fontWeight: '400',
    color: colors.ink,
    lineHeight: (IS_MOBILE ? typography.xl : typography['2xl']) * typography.tight * 1.3,
    marginBottom: spacing.md,
    fontStyle: 'italic',
    ...displayFont,
  },
  proverbAuthor: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.medium,
    letterSpacing: 0.5,
  },

  // Hero
  hero: { marginBottom: spacing.xl },
  heroTitle: {
    fontSize: IS_MOBILE ? typography['2xl'] : typography['3xl'],
    fontWeight: '600',
    color: colors.ink,
    lineHeight: (IS_MOBILE ? typography['2xl'] : typography['3xl']) * typography.tight,
    marginBottom: spacing.md,
    ...displayFont,
  },
  heroSubtitle: {
    fontSize: IS_MOBILE ? typography.sm : typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
    fontWeight: typography.regular,
  },

  // Capabilities
  capRow: { gap: 1, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  capItem: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  capIndex: {
    width: 36, paddingTop: 2, flexShrink: 0,
  },
  capIndexText: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.gold, letterSpacing: 1,
    ...displayFont,
  },
  capBody: { flex: 1 },
  capTitle: {
    fontSize: typography.sm, fontWeight: typography.semibold,
    color: colors.ink, marginBottom: 3,
  },
  capText: {
    fontSize: typography.xs, color: colors.textMuted,
    lineHeight: typography.xs * typography.relaxed,
  },

  // Upload
  uploadSection: { marginBottom: spacing.lg },
  uploadLabel: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: colors.textMuted, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  errorBox: {
    backgroundColor: colors.errorSoft, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  errorText: { color: colors.error, fontSize: typography.sm, fontWeight: typography.medium },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: IS_MOBILE ? 15 : 17,
    marginBottom: spacing.md,
    ...(Platform.OS === 'web' ? shadows.md : shadows.md),
  },
  ctaBtnDisabled: { backgroundColor: colors.surfaceAlt },
  ctaText: {
    fontSize: typography.base, fontWeight: typography.semibold,
    color: colors.textInverse, letterSpacing: 0.3,
  },
  ctaTextDisabled: { color: colors.textMuted },
  ctaArrow: {
    fontSize: typography.base, color: colors.gold, fontWeight: typography.bold,
  },

  footerNote: {
    fontSize: typography.xs, color: colors.textMuted,
    textAlign: 'center', letterSpacing: 0.3,
  },
});

export default HomeScreen;
