import { AIController } from '../ai/ai.controller';
import { Logger } from '@nestjs/common';
import type { AIJobData, BullMQService } from '../bullmq/bullmq.service';

const logger = new Logger('TestAIEndpoints');

// Simple mock BullMQService for testing
class MockBullMQService {
  private callCount = 0;

  addAIJob(data: AIJobData): Promise<string> {
    this.callCount++;
    logger.log(
      `Mock addAIJob called (${this.callCount}) with:`,
      JSON.stringify(data, null, 2)
    );
    return Promise.resolve(`test-job-id-${this.callCount}`);
  }

  getCallCount(): number {
    return this.callCount;
  }
}

async function testAIEndpoints() {
  logger.log('Starting AI endpoints test...');

  try {
    const mockBullMQService = new MockBullMQService();
    const aiController = new AIController(
      mockBullMQService as unknown as BullMQService
    );

    logger.log('Testing summarize endpoint...');
    const summarizeResult = await aiController.summarize({
      chatId: 'test-chat-1',
      userId: 'test-user-1',
      content: 'This is a test message that needs to be summarized.',
    });
    logger.log('Summarize result:', JSON.stringify(summarizeResult, null, 2));

    logger.log('Testing translate endpoint...');
    const translateResult = await aiController.translate({
      chatId: 'test-chat-1',
      userId: 'test-user-1',
      content: 'Hello, how are you today?',
      targetLanguage: 'es',
    });
    logger.log('Translate result:', JSON.stringify(translateResult, null, 2));

    logger.log('Testing bot-response endpoint...');
    const botResponseResult = await aiController.botResponse({
      chatId: 'test-chat-1',
      userId: 'test-user-1',
      content: 'Tell me a joke',
      message: 'Tell me a joke',
      botPersonality: 'funny',
    });
    logger.log(
      'Bot response result:',
      JSON.stringify(botResponseResult, null, 2)
    );

    // Verify BullMQService was called correctly
    const callCount = mockBullMQService.getCallCount();
    if (callCount === 3) {
      logger.log('✅ All AI endpoints test completed successfully!');
      logger.log(
        `✅ BullMQService.addAIJob was called ${callCount} times as expected`
      );
    } else {
      throw new Error(`Expected 3 calls to addAIJob, but got ${callCount}`);
    }
  } catch (error) {
    logger.error('❌ AI endpoints test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void testAIEndpoints();
}
