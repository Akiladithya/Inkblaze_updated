// src/components/DownloadButton.js

import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getPdfUrl } from '../services/api';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const DownloadButton = ({ outputPdfPath }) => {
  const [status, setStatus] = useState('idle'); // idle | downloading | done | error
  const [progress, setProgress] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const animatePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDownload = async () => {
    if (status === 'downloading') return;

    try {
      setStatus('downloading');
      setProgress(0);

      const pdfUrl = getPdfUrl(outputPdfPath);
      const fileName = 'highlighted_with_mcqs.pdf';

      if (Platform.OS === 'web') {
        // Web: open in new tab (browser handles download)
        window.open(pdfUrl, '_blank');
        setStatus('done');
        return;
      }

      // Native: download to local filesystem
      const localUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        pdfUrl,
        localUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(
              Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
            );
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Highlighted PDF',
          });
        }
        setStatus('done');
      } else {
        throw new Error('Download failed — no URI returned');
      }
    } catch (err) {
      console.error('Download error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'done':
        return styles.buttonDone;
      case 'error':
        return styles.buttonError;
      default:
        return {};
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'downloading':
        return progress > 0 ? `Downloading… ${progress}%` : 'Downloading…';
      case 'done':
        return '✓ Saved to device';
      case 'error':
        return 'Download failed — retry';
      default:
        return '↓  Download PDF';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={handleDownload}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        activeOpacity={0.85}
        disabled={status === 'downloading'}
      >
        <View style={styles.inner}>
          {status === 'downloading' ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : null}
          <Text style={[styles.label, status === 'done' && styles.labelDone]}>
            {getLabel()}
          </Text>
        </View>

        {/* Progress fill */}
        {status === 'downloading' && progress > 0 && (
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    minHeight: 54,
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonDone: {
    backgroundColor: colors.success,
  },
  buttonError: {
    backgroundColor: colors.error,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1,
  },
  label: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textInverse,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelDone: {
    color: colors.textInverse,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 0,
  },
});

export default DownloadButton;
