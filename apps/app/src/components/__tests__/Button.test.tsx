import { describe, it, expect, vi } from 'vitest';

// Simple utility functions for testing
const validateButtonProps = (props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const errors: string[] = [];

  if (!props.title || props.title.trim() === '') {
    errors.push('Title is required');
  }

  if (typeof props.onPress !== 'function') {
    errors.push('onPress must be a function');
  }

  if (props.disabled !== undefined && typeof props.disabled !== 'boolean') {
    errors.push('disabled must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const simulateButtonPress = (onPress: () => void, disabled = false) => {
  if (!disabled) {
    onPress();
  }
};

describe('Button utilities', () => {
  describe('validateButtonProps', () => {
    it('validates correct button props', () => {
      const mockPress = vi.fn();
      const result = validateButtonProps({
        title: 'Click Me',
        onPress: mockPress,
        disabled: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty title', () => {
      const mockPress = vi.fn();
      const result = validateButtonProps({
        title: '',
        onPress: mockPress,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('rejects invalid onPress', () => {
      const result = validateButtonProps({
        title: 'Click Me',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        onPress: 'not a function' as any,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('onPress must be a function');
    });

    it('rejects invalid disabled prop', () => {
      const mockPress = vi.fn();
      const result = validateButtonProps({
        title: 'Click Me',
        onPress: mockPress,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        disabled: 'not a boolean' as any,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('disabled must be a boolean');
    });
  });

  describe('simulateButtonPress', () => {
    it('calls onPress when not disabled', () => {
      const mockPress = vi.fn();
      simulateButtonPress(mockPress, false);

      expect(mockPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const mockPress = vi.fn();
      simulateButtonPress(mockPress, true);

      expect(mockPress).not.toHaveBeenCalled();
    });

    it('handles multiple presses', () => {
      const mockPress = vi.fn();
      simulateButtonPress(mockPress);
      simulateButtonPress(mockPress);
      simulateButtonPress(mockPress);

      expect(mockPress).toHaveBeenCalledTimes(3);
    });
  });
});
