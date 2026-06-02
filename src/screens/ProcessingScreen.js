// src/screens/ProcessingScreen.js

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import LoadingView from '../components/LoadingView';
import { highlightText } from '../services/api';
import { getFile, clearFile } from '../utils/fileStore';
import { colors, typography, spacing, radius } from '../styles/theme';

const ProcessingScreen = ({ route, navigation }) => {
  const { fileName } = route.params;
  const file = getFile();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    processFile();
  }, []);

  const processFile = async () => {
    try {
      setError('');
      const result = await highlightText(file, setUploadProgress);

      if (result?.highlighted_text && result?.output_pdf_path) {
        clearFile();
        navigation.replace('Result', {
          highlightedText: result.highlighted_text,
          outputPdfPath: result.output_pdf_path,
          fileName: fileName,
        });
      } else {
        throw new Error('Invalid response from server. Missing expected fields.');
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Processing failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setError('');
    processFile();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <LoadingView uploadProgress={uploadProgress} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Error state
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? { fontFamily: "'Cormorant Garamond', Georgia, serif" } : { fontFamily: 'Georgia' }),
    marginBottom: spacing.sm, textAlign: 'center',
  },
  errorBody: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sm * typography.relaxed,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  errorActions: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  retryBtnText: {
    color: colors.textInverse,
    fontWeight: typography.bold,
    fontSize: typography.base,
  },
  backBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    fontSize: typography.base,
  },
});

export default ProcessingScreen;
