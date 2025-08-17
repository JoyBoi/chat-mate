describe('ChatMate App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display the app correctly', async () => {
    // Wait for the app to load
    await waitFor(element(by.id('app-container')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to authentication screen', async () => {
    // Check if auth screen is visible or navigate to it
    await expect(element(by.id('auth-screen')).atIndex(0)).toBeVisible();
  });

  it('should allow guest authentication', async () => {
    // Look for guest login button
    const guestButton = element(by.id('guest-login-button'));
    await waitFor(guestButton).toBeVisible().withTimeout(5000);
    await guestButton.tap();
    
    // Verify navigation to main app
    await waitFor(element(by.id('main-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
