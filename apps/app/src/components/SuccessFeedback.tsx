import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';

interface SuccessFeedbackProps {
  visible: boolean;
  message?: string;
  duration?: number;
  style?: ViewStyle;
  onHide?: () => void;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  visible,
  message = 'Data loaded successfully',
  duration = 2000,
  style,
  onHide,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  // Native driver is not supported on web
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, slideAnim, duration, onHide, useNativeDriver]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
