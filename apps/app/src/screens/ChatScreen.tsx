import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User } from '@supabase/supabase-js';
import { useSocket } from '../hooks/useSocket';
import { Message } from '../lib/socket';

interface ChatScreenProps {
  chatType: 'global' | 'bot';
  botId?: string;
  botName?: string;
  onBack: () => void;
  user: User | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatType,
  botId,
  botName,
  onBack,
  user,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectedUsers] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket integration
  const {
    isConnected,
    sendMessage: socketSendMessage,
    joinGlobalChat,
    joinBotChat,
    startTyping,
    stopTyping,
  } = useSocket({
    onMessage: (message: Message) => {
      setMessages(prev => [...prev, message]);
    },
  });

  const loadInitialMessages = useCallback(() => {
    // Mock initial messages
    const mockMessages: Message[] = [
      {
        id: '1',
        content:
          chatType === 'global'
            ? 'Welcome to the global chat!'
            : `Hello! I'm ${botName}. How can I help you today?`,
        userId: 'system',
        userName: 'System',
        timestamp: new Date(Date.now() - 60000),
        type: chatType === 'global' ? 'system' : 'bot',
      },
    ];
    setMessages(mockMessages);
  }, [chatType, botName]);

  useEffect(() => {
    // TODO: Initialize Socket.io connection
    // TODO: Join appropriate room (global or bot-specific)
    // TODO: Listen for messages, typing indicators, user presence
    loadInitialMessages();

    // Join appropriate chat room
    if (isConnected) {
      if (chatType === 'global') {
        void joinGlobalChat();
      } else if (chatType === 'bot' && botId) {
        void joinBotChat(botId);
      }
    }
  }, [
    chatType,
    botId,
    isConnected,
    loadInitialMessages,
    joinGlobalChat,
    joinBotChat,
  ]);

  const sendMessage = () => {
    if (inputText.trim() && isConnected) {
      const success = socketSendMessage(inputText, chatType, botId);

      if (success) {
        setInputText('');
        handleStopTyping();
      }
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Handle typing indicators
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      void startTyping(chatType, botId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      void stopTyping(chatType, botId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === user?.id;
    const isBot = item.type === 'bot';
    const isSystem = item.type === 'system';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage && styles.ownMessage,
          isSystem && styles.systemMessage,
        ]}
      >
        {!isOwnMessage && !isSystem && (
          <Text style={styles.userName}>
            {isBot ? `🤖 ${item.userName}` : item.userName}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage && styles.ownMessageBubble,
            isBot && styles.botMessageBubble,
            isSystem && styles.systemMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage && styles.ownMessageText,
              isSystem && styles.systemMessageText,
            ]}
          >
            {item.content}
          </Text>
          {item.isStreaming && (
            <View style={styles.streamingIndicator}>
              <Text style={styles.streamingText}>●●●</Text>
            </View>
          )}
        </View>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {chatType === 'global' ? 'Global Chat' : botName}
      </Text>
      {chatType === 'global' && (
        <Text style={styles.userCount}>{connectedUsers} online</Text>
      )}
      {isTyping && (
        <Text style={styles.typingIndicator}>Someone is typing...</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => {
          void flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          void flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
          onBlur={handleStopTyping}
          placeholder={`Message ${chatType === 'global' ? 'everyone' : botName}...`}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || !isConnected) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || !isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  systemMessage: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 8,
  },
  messageBubble: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
  },
  botMessageBubble: {
    backgroundColor: '#e8f4fd',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  systemMessageBubble: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  systemMessageText: {
    color: '#666',
    fontStyle: 'italic',
  },
  streamingIndicator: {
    marginTop: 4,
  },
  streamingText: {
    color: '#007AFF',
    fontSize: 12,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
