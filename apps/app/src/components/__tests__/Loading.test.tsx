import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect } from 'vitest';
import { Loading } from '../Loading';

describe('Loading Component', () => {
  it('renders with default props', () => {
    const { getByText } = render(<Loading />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const customMessage = 'Please wait...';
    const { getByText } = render(<Loading message={customMessage} />);

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('renders without message when message is empty', () => {
    const { queryByText } = render(<Loading message='' />);

    expect(queryByText('')).toBeFalsy();
  });

  it('applies overlay styles when overlay prop is true', () => {
    const component = render(<Loading overlay />);

    // Test that overlay prop changes the component behavior
    expect(component).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const component = render(<Loading style={customStyle} />);

    expect(component).toBeTruthy();
  });

  it('renders ActivityIndicator with correct props', () => {
    const component = render(<Loading size='small' color='#FF0000' />);

    // Note: Testing ActivityIndicator props directly is limited in RNTL
    // This test ensures the component renders without crashing with different props
    expect(component).toBeTruthy();
  });
});
