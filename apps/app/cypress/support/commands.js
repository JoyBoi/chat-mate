// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for guest login
Cypress.Commands.add('loginAsGuest', () => {
  cy.visit('/');
  cy.get('[data-testid="guest-login-button"]', { timeout: 10000 }).click();
  cy.url().should('not.include', '/auth');
});

// Custom command for waiting for app to load
Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('[data-testid="app-container"]', { timeout: 15000 }).should('be.visible');
});

// Custom command for navigating to chat
Cypress.Commands.add('navigateToChat', () => {
  cy.get('[data-testid="chat-tab"]').click();
  cy.get('[data-testid="chat-screen"]').should('be.visible');
});