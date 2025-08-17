import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, loading } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Success',
        isSignUp
          ? 'Account created successfully! Please check your email to verify your account.'
          : 'Signed in successfully!'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChatMate</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize='none'
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => void handleAuth()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text style={styles.switchText}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 10,
  },
  switchText: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
  },
});
