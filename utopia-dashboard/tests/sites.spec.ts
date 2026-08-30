import { test, expect } from '@playwright/test';

test.describe('Sites & Detachments - Roster Management', () => {
  
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // 1. Intercept Detachments query to prevent polluting the live map
    await page.route('**/rest/v1/detachments*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'mock-site-1',
            branch_code: 'BDO-MAK-01',
            branch_name: 'BDO Makati',
            branch_location: 'Makati Ave',
            is_active: true,
            assigned_inspector_id: null
          }]),
        });
      } else {
        await route.fulfill({ status: 200, body: '[]' });
      }
    });

    // 2. Execute Real Superadmin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 90000 });
    
    // 3. Navigate to Sites
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: 'Detachment Roster' })).toBeVisible({ timeout: 15000 });
  });

  test('Superadmin can open Add Detachment and Verification QR Code modals', async ({ page }) => {
    // 1. Verify table rendered the mock detachment
    await expect(page.getByText('BDO-MAK-01')).toBeVisible();
    await expect(page.getByText('BDO Makati')).toBeVisible();

    // 2. Open Add Detachment Modal
    await page.click('button:has-text("Add Detachment")');
    await expect(page.getByRole('heading', { name: 'Register New Detachment' })).toBeVisible();
    await page.click('button:has-text("×")'); // Close modal

    // 3. Open QR Code Modal
    await page.getByTitle('Generate Verification QR').first().click();
    await expect(page.getByRole('heading', { name: 'Verification QR Code' })).toBeVisible();
    await expect(page.getByText('Scan this code using the Utopia Inspector App')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print Document' })).toBeVisible();
  });

  test('Delete detachment modal rigorously enforces case-sensitive validation', async ({ page }) => {
    // 1. Trigger Delete Modal
    await page.getByTitle('Delete Detachment').first().click();
    await expect(page.getByRole('heading', { name: /Danger: Permanent Deletion/i })).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: 'Confirm Delete' });

    // 2. Verify disabled state
    await expect(confirmBtn).toBeDisabled();

    // 3. Verify lowercase fails
    await page.fill('input[placeholder="DELETE"]', 'delete');
    await expect(confirmBtn).toBeDisabled();

    // 4. Verify exact uppercase unlocks
    await page.fill('input[placeholder="DELETE"]', 'DELETE');
    await expect(confirmBtn).toBeEnabled();
  });
});