import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { BotAvatar } from '../components/avatars/BotAvatars';
import {
  useFeaturedBots,
  useNonFeaturedBots,
  BotPersonality,
} from '../hooks/api/useBots';
import { SuccessFeedback } from '../components/SuccessFeedback';
import { useMultiQuerySuccessFeedback } from '../hooks/useSuccessFeedback';
// import { ListComparison } from "../components/performance/ListComparison";

interface BotSelectionScreenProps {
  onSelectBot: (bot: BotPersonality) => void;
  onGlobalChat: () => void;
}

export const BotSelectionScreen: React.FC<BotSelectionScreenProps> = ({
  onSelectBot,
  onGlobalChat,
}) => {
  const [showPerformanceTest, setShowPerformanceTest] = useState(false);
  const featuredBotsQuery = useFeaturedBots();
  const nonFeaturedBotsQuery = useNonFeaturedBots();
  const { data: featuredBots, isLoading: featuredLoading } = featuredBotsQuery;
  const { data: nonFeaturedBots, isLoading: nonFeaturedLoading } =
    nonFeaturedBotsQuery;
  const isLoading = featuredLoading || nonFeaturedLoading;

  // Success feedback for bot data loading
  const successFeedback = useMultiQuerySuccessFeedback(
    [featuredBotsQuery, nonFeaturedBotsQuery],
    {
      successMessage: 'Bot personalities loaded successfully! 🤖',
      duration: 2500,
    }
  );

  const renderBot = ({ item }: { item: BotPersonality }) => (
    <TouchableOpacity style={styles.botCard} onPress={() => onSelectBot(item)}>
      <View style={styles.avatarContainer}>
        <BotAvatar botId={item.id} size={40} style={styles.avatar} />
      </View>
      <View style={styles.botInfo}>
        <Text style={styles.botName}>{item.name}</Text>
        <Text style={styles.botDescription}>{item.description}</Text>
        <Text style={styles.botPersonality}>Personality: {item.prompt}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedBot = ({ item }: { item: BotPersonality }) => (
    <TouchableOpacity
      style={styles.featuredBotCard}
      onPress={() => onSelectBot(item)}
    >
      <View style={styles.featuredAvatarContainer}>
        <BotAvatar botId={item.id} size={50} style={styles.avatar} />
      </View>
      <Text style={styles.featuredBotName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (showPerformanceTest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowPerformanceTest(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Performance Test</Text>
        </View>
        <Text style={styles.sectionTitle}>
          FlashList integration pending...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Chat</Text>
        <TouchableOpacity
          style={styles.performanceButton}
          onPress={() => setShowPerformanceTest(true)}
        >
          <Text style={styles.performanceButtonText}>Performance Test</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.globalChatButton} onPress={onGlobalChat}>
        {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
        <Text
          style={styles.globalChatEmoji}
          role='img'
          accessibilityLabel='Global chat icon'
        >
          🌍
        </Text>
        <View style={styles.globalChatInfo}>
          <Text style={styles.globalChatTitle}>Global Sandbox Chat</Text>
          <Text style={styles.globalChatDescription}>
            Join the community chat with other users
          </Text>
        </View>
      </TouchableOpacity>

      {/* Featured Bots Section */}
      {featuredBots && featuredBots.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
            <Text>⭐</Text> Featured Bots
          </Text>
          <FlatList
            data={featuredBots}
            renderItem={renderFeaturedBot}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredBotsContainer}
            style={styles.featuredBotsList}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>All AI Bots</Text>

      {isLoading ? (
        <ActivityIndicator
          size='large'
          color='#007AFF'
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={nonFeaturedBots || []}
          renderItem={renderBot}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
      <SuccessFeedback
        visible={successFeedback.visible}
        message={successFeedback.message}
        onHide={successFeedback.hideFeedback}
        duration={successFeedback.duration}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  performanceButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  performanceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  globalChatButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  globalChatEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  globalChatInfo: {
    flex: 1,
  },
  globalChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  globalChatDescription: {
    fontSize: 14,
    color: '#e6f2ff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  botCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    // Style for SVG avatar
  },
  botAvatar: {
    fontSize: 32,
  },
  svgAvatar: {
    alignSelf: 'center',
  },
  botInfo: {
    flex: 1,
  },
  botName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  botDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  botPersonality: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 20,
  },
  featuredBotsList: {
    marginBottom: 24,
  },
  featuredBotsContainer: {
    paddingHorizontal: 8,
  },
  featuredBotCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredAvatarContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBotName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
