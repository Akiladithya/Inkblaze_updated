// src/screens/MCQScreen.js
//
// Standalone screen: upload a file, pick question count, generate MCQs.
// Accessible from ResultScreen via "Generate More MCQs" or from a future tab bar.

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import UploadCard from '../components/UploadCard';
import { useMCQ } from '../hooks/useMCQ';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const QUESTION_COUNTS = [3, 5, 10, 15];

const MCQScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const { generate, state, reset } = useMCQ();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleGenerate = async () => {
    if (!selectedFile) return;
    Animated.timing(fadeAnim, { toValue: 0.4, duration: 200, useNativeDriver: true }).start();
    try {
      await generate(selectedFile, numQuestions);
    } catch (_) {}
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
  };

  // Parse MCQ text into question blocks
  const parsedMCQs = parseMCQText(state.mcqs || '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate MCQs</Text>
        {state.status !== 'idle' && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* File picker */}
        {state.status === 'idle' && (
          <>
            <Text style={styles.sectionLabel}>DOCUMENT</Text>
            <UploadCard onFileSelected={setSelectedFile} selectedFile={selectedFile} />

            {/* Question count selector */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              NUMBER OF QUESTIONS
            </Text>
            <View style={styles.countRow}>
              {QUESTION_COUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.countChip, numQuestions === n && styles.countChipActive]}
                  onPress={() => setNumQuestions(n)}
                >
                  <Text
                    style={[
                      styles.countChipText,
                      numQuestions === n && styles.countChipTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Generate button */}
            <TouchableOpacity
              style={[styles.generateBtn, !selectedFile && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!selectedFile}
              activeOpacity={0.85}
            >
              <Text style={styles.generateBtnText}>Generate {numQuestions} MCQs →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Loading */}
        {state.status === 'loading' && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Generating questions…</Text>
            <Text style={styles.loadingSubtitle}>
              Mistral is reading your document
            </Text>
          </View>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Generation failed</Text>
            <Text style={styles.errorBody}>{state.error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {state.status === 'done' && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {parsedMCQs.length} Questions Generated
              </Text>
              <Text style={styles.resultSub}>
                From: {selectedFile?.name}
              </Text>
            </View>

            {parsedMCQs.length > 0
              ? parsedMCQs.map((q, i) => (
                  <MCQCard key={i} question={q} index={i} />
                ))
              : (
                // Raw fallback
                <View style={styles.rawBox}>
                  <Text style={styles.rawText}>{state.mcqs}</Text>
                </View>
              )}

            <TouchableOpacity style={styles.newBtn} onPress={handleReset}>
              <Text style={styles.newBtnText}>Generate for another file</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

// ── MCQ Card ──────────────────────────────────────────────────────────────────

const OPTION_COLORS = {
  A: '#DBEAFE',
  B: '#D1FAE5',
  C: '#FEF3C7',
  D: '#FCE7F3',
};
const OPTION_TEXT_COLORS = {
  A: '#1E40AF',
  B: '#065F46',
  C: '#92400E',
  D: '#9D174D',
};

const MCQCard = ({ question, index }) => {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const correct = question.answer?.toUpperCase();

  return (
    <View style={mcqStyles.card}>
      <View style={mcqStyles.qHeader}>
        <View style={mcqStyles.qNum}>
          <Text style={mcqStyles.qNumText}>{index + 1}</Text>
        </View>
        <Text style={mcqStyles.qText}>{question.question}</Text>
      </View>

      <View style={mcqStyles.options}>
        {question.options.map((opt) => {
          const letter = opt.letter.toUpperCase();
          const isSelected = selected === letter;
          const isCorrect = revealed && letter === correct;
          const isWrong = revealed && isSelected && letter !== correct;

          return (
            <TouchableOpacity
              key={letter}
              style={[
                mcqStyles.option,
                isSelected && !revealed && mcqStyles.optionSelected,
                isCorrect && mcqStyles.optionCorrect,
                isWrong && mcqStyles.optionWrong,
              ]}
              onPress={() => !revealed && setSelected(letter)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  mcqStyles.letterBadge,
                  { backgroundColor: OPTION_COLORS[letter] || '#F3F4F6' },
                ]}
              >
                <Text
                  style={[
                    mcqStyles.letterText,
                    { color: OPTION_TEXT_COLORS[letter] || '#374151' },
                  ]}
                >
                  {letter}
                </Text>
              </View>
              <Text style={mcqStyles.optionText}>{opt.text}</Text>
              {isCorrect && <Text style={mcqStyles.tick}>✓</Text>}
              {isWrong && <Text style={mcqStyles.cross}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && !revealed && (
        <TouchableOpacity
          style={mcqStyles.revealBtn}
          onPress={() => setRevealed(true)}
        >
          <Text style={mcqStyles.revealBtnText}>Reveal Answer</Text>
        </TouchableOpacity>
      )}

      {revealed && (
        <View style={mcqStyles.answerBanner}>
          <Text style={mcqStyles.answerBannerText}>
            ✓ Correct answer: {correct}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Parse MCQ text into structured objects ────────────────────────────────────

function parseMCQText(text) {
  if (!text) return [];
  const blocks = text.split(/\n(?=\d+[\.\)])/);
  const results = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const qMatch = lines[0].match(/^\d+[\.\)]\s*(.+)/);
    if (!qMatch) continue;
    const question = qMatch[1].trim();

    const options = [];
    let answer = '';

    for (let i = 1; i < lines.length; i++) {
      const optMatch = lines[i].match(/^([A-Da-d])[\.\)]\s*(.+)/);
      if (optMatch) {
        options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
        continue;
      }
      const ansMatch = lines[i].match(/^(?:Answer|Correct)[:\s]+([A-Da-d])/i);
      if (ansMatch) {
        answer = ansMatch[1].toUpperCase();
      }
    }

    if (question && options.length >= 2) {
      results.push({ question, options, answer });
    }
  }

  return results;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: { fontSize: 20, color: colors.textSecondary },
  headerTitle: {
    flex: 1,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtnText: { fontSize: typography.sm, color: colors.textSecondary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },

  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.extrabold,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  // Count selector
  countRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  countChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  countChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  countChipText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textMuted,
  },
  countChipTextActive: { color: colors.textInverse },

  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    ...shadows.md,
  },
  generateBtnDisabled: { backgroundColor: colors.textMuted },
  generateBtnText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textInverse,
  },

  // Loading
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  loadingTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  loadingSubtitle: { fontSize: typography.sm, color: colors.textMuted },

  // Error
  errorBox: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  errorBody: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: typography.sm * 1.6,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: colors.textInverse,
    fontWeight: typography.semibold,
    fontSize: typography.sm,
  },

  // Results header
  resultHeader: { marginBottom: spacing.lg },
  resultTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  resultSub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },

  rawBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  rawText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontFamily: 'Courier New',
    lineHeight: typography.sm * 1.7,
  },

  newBtn: {
    marginTop: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
});

const mcqStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  qHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  qNum: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  qNumText: {
    fontSize: typography.xs,
    fontWeight: typography.extrabold,
    color: colors.textInverse,
  },
  qText: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: typography.base * 1.5,
  },
  options: { gap: spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successLight },
  optionWrong: { borderColor: colors.error, backgroundColor: colors.errorLight },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  letterText: { fontSize: typography.sm, fontWeight: typography.bold },
  optionText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
    lineHeight: typography.sm * 1.5,
  },
  tick: { fontSize: 16, color: colors.success },
  cross: { fontSize: 16, color: colors.error },
  revealBtn: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  revealBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textInverse,
  },
  answerBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  answerBannerText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.success,
  },
});

export default MCQScreen;
