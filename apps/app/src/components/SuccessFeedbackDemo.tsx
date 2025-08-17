import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFeaturedBots, useNonFeaturedBots } from '../hooks/api/useBots';
import { useCreateChat } from '../hooks/api/useChats';
import { SuccessFeedback } from './SuccessFeedback';
import {
  useSuccessFeedback,
  useMultiQuerySuccessFeedback,
} from '../hooks/useSuccessFeedback';
import { handleError } from '../lib/error-handler';

/**
 * Demo component showcasing both success feedback hooks
 * This demonstrates immediate visual feedback for API operations
 */
export const SuccessFeedbackDemo: React.FC = () => {
  // Multi-query success feedback (for multiple API calls)
  const featuredBotsQuery = useFeaturedBots();
  const nonFeaturedBotsQuery = useNonFeaturedBots();

  const multiQueryFeedback = useMultiQuerySuccessFeedback(
    [featuredBotsQuery, nonFeaturedBotsQuery],
    {
      successMessage: 'All bot data loaded! 🤖✨',
      duration: 3000,
    }
  );

  // Single mutation success feedback
  const createChatMutation = useCreateChat();

  const mutationFeedback = useSuccessFeedback(createChatMutation, {
    successMessage: 'Chat created successfully! 💬',
    duration: 2500,
  });

  // Handle mutation errors with centralized error handling
  useEffect(() => {
    if (createChatMutation.error) {
      handleError(createChatMutation.error, {
        additionalData: { source: 'create-chat-demo' },
      });
    }
  }, [createChatMutation.error]);

  const handleCreateChat = () => {
    createChatMutation.mutate({
      name: `Demo Chat ${Date.now()}`,
      description: 'A demo chat room',
      type: 'group',
      isPrivate: false,
    });
  };

  const isLoading =
    featuredBotsQuery.isLoading || nonFeaturedBotsQuery.isLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Success Feedback Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi-Query Loading</Text>
        <Text style={styles.description}>
          Loading bot data from multiple endpoints...
        </Text>
        <Text style={styles.status}>
          Status: {isLoading ? 'Loading...' : 'Complete'}
        </Text>
        <Text style={styles.status}>
          Featured Bots: {featuredBotsQuery.data?.length || 0}
        </Text>
        <Text style={styles.status}>
          Other Bots: {nonFeaturedBotsQuery.data?.length || 0}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mutation Demo</Text>
        <TouchableOpacity
          style={[
            styles.button,
            createChatMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleCreateChat}
          disabled={createChatMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {createChatMutation.isPending ? 'Creating...' : 'Create Demo Chat'}
          </Text>
        </TouchableOpacity>
        {createChatMutation.error && (
          <Text style={styles.error}>An error occurred. Please try again.</Text>
        )}
      </View>

      {/* Success feedback components */}
      <SuccessFeedback
        visible={multiQueryFeedback.visible}
        message={multiQueryFeedback.message}
        onHide={multiQueryFeedback.hideFeedback}
        duration={multiQueryFeedback.duration}
      />

      <SuccessFeedback
        visible={mutationFeedback.visible}
        message={mutationFeedback.message}
        onHide={mutationFeedback.hideFeedback}
        duration={mutationFeedback.duration}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  status: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
