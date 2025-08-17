describe('ChatMate Web App', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application', () => {
    cy.waitForAppLoad();
    cy.title().should('contain', 'ChatMate');
  });

  it('should display authentication screen initially', () => {
    cy.get('[data-testid="auth-screen"]').should('be.visible');
    cy.get('[data-testid="guest-login-button"]').should('be.visible');
  });

  it('should allow guest authentication', () => {
    cy.loginAsGuest();
    cy.get('[data-testid="main-screen"]').should('be.visible');
  });

  it('should navigate to chat after authentication', () => {
    cy.loginAsGuest();
    cy.navigateToChat();
    cy.get('[data-testid="chat-input"]').should('be.visible');
  });

  it('should send a message in chat', () => {
    cy.loginAsGuest();
    cy.navigateToChat();
    
    const testMessage = 'Hello, this is a test message!';
    cy.get('[data-testid="chat-input"]').type(testMessage);
    cy.get('[data-testid="send-button"]').click();
    
    cy.get('[data-testid="message-list"]')
      .should('contain', testMessage);
  });

  it('should interact with AI bot', () => {
    cy.loginAsGuest();
    cy.navigateToChat();
    
    // Select an AI bot
    cy.get('[data-testid="bot-selector"]').click();
    cy.get('[data-testid="bot-option"]').first().click();
    
    // Send message to bot
    const botMessage = 'Hello bot!';
    cy.get('[data-testid="chat-input"]').type(botMessage);
    cy.get('[data-testid="send-button"]').click();
    
    // Wait for bot response
    cy.get('[data-testid="message-list"]', { timeout: 10000 })
      .should('contain', botMessage);
  });

  it('should handle responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.loginAsGuest();
    cy.get('[data-testid="main-screen"]').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid="main-screen"]').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="main-screen"]').should('be.visible');
  });
});