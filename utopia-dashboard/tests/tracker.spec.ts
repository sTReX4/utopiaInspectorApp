import { test, expect } from '@playwright/test';

test.describe('Live Inspector Tracker & GPS Mapping', () => {
  
  test.setTimeout(120000);

  test('Renders routing log and initializes the Leaflet map', async ({ page }) => {
    // 1. Intercept Audits for Tracker
    await page.route('**/rest/v1/audits*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'mock-route-1',
          inspector_name: 'Inspector Charlie',
          branch_name: 'BDO Alabang',
          time_in: '2026-08-30T08:00:00Z',
          time_out: '2026-08-30T09:00:00Z',
          gps_latitude: 14.4166,
          gps_longitude: 121.0422
        }]),
      });
    });

    // 2. Execute Real Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 90000 });
    
    // 3. Navigate to Tracker
    await page.goto('/tracker');
    await expect(page.getByRole('heading', { name: 'Live Inspector Routing' })).toBeVisible({ timeout: 15000 });

    // 4. Verify routing log rendered successfully
    await expect(page.getByText('Daily Field Activity')).toBeVisible();
    await expect(page.getByText('Inspector Charlie')).toBeVisible();
    await expect(page.getByText('BDO Alabang')).toBeVisible();
    
    // 5. Verify the Leaflet map container physically mounted in the DOM
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });
});