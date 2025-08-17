import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { handleError } from '../lib/error-handler';
import { AppPreferences } from '../lib/storage';
import { BotSelectionScreen } from './BotSelectionScreen';
import { ChatScreen } from './ChatScreen';
import { BotPersonality } from '../hooks/api/useBots';

type Screen = 'home' | 'bot-selection' | 'chat';

export const HomeScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedBot, setSelectedBot] = useState<BotPersonality | null>(null);
  const [chatType, setChatType] = useState<'global' | 'bot'>('global');

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        handleError(error, { additionalData: { source: 'sign-out' } });
      }
    } catch (error) {
      handleError(error, { additionalData: { source: 'sign-out' } });
    }
  };

  const handleSelectBot = (bot: BotPersonality) => {
    setSelectedBot(bot);
    setChatType('bot');
    setCurrentScreen('chat');
  };

  const handleGlobalChat = () => {
    setSelectedBot(null);
    setChatType('global');
    setCurrentScreen('chat');
  };

  const handleBackToBotSelection = () => {
    setCurrentScreen('bot-selection');
    setSelectedBot(null);
  };

  const testStorage = () => {
    // Test MMKV storage
    AppPreferences.setTheme('dark');
    AppPreferences.setLanguage('es');
    AppPreferences.setChatDraft('test-chat', 'Hello world!');
    AppPreferences.addRecentEmoji('😀');
    AppPreferences.addRecentEmoji('🎉');

    const theme = AppPreferences.getTheme();
    const language = AppPreferences.getLanguage();
    const draft = AppPreferences.getChatDraft('test-chat');
    const emojis = AppPreferences.getRecentEmojis();

    Alert.alert(
      'Storage Test',
      `Theme: ${theme}\nLanguage: ${language}\nDraft: ${draft}\nEmojis: ${emojis.join(', ')}`
    );
  };

  if (currentScreen === 'bot-selection') {
    return (
      <BotSelectionScreen
        onSelectBot={handleSelectBot}
        onGlobalChat={handleGlobalChat}
      />
    );
  }

  if (currentScreen === 'chat') {
    return (
      <ChatScreen
        chatType={chatType}
        botId={selectedBot?.id}
        botName={selectedBot?.name}
        onBack={handleBackToBotSelection}
        user={user}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ChatMate!</Text>
      <Text style={styles.subtitle}>Hello, {user?.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Info</Text>
        <Text style={styles.info}>ID: {user?.id}</Text>
        <Text style={styles.info}>Email: {user?.email}</Text>
        <Text style={styles.info}>
          Created:{' '}
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setCurrentScreen('bot-selection')}
      >
        <Text style={styles.buttonText}>Start Chatting</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testStorage}>
        <Text style={styles.buttonText}>Test MMKV Storage</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.signOutButton]}
        onPress={() => void handleSignOut()}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
