import { test, expect } from '@playwright/test';

test.describe('Personnel & Provisioning - HR & Device Management', () => {

    test.setTimeout(60000);

  test('Admin Role: Strictly blocked from HR and Provisioning actions', async ({ page }) => {
    // 1. Execute Real Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    // 2. Wait for Session & Navigate
    await page.waitForURL('**/');
    await page.goto('/personnel');

    // Wait up to 15 seconds for the live page to render
    await expect(page.getByRole('heading', { name: 'Personnel & Provisioning' })).toBeVisible({ timeout: 35000 });

    // 3. Verify Guards Tab (Default) is Locked
    const hrRestrictedBtn = page.getByRole('button', { name: /HR Access Required/i });
    await expect(hrRestrictedBtn).toBeVisible();
    await expect(hrRestrictedBtn).toBeDisabled();

    // 4. Switch to Device Provisioning Tab
    await page.click('button:has-text("Device Provisioning")');
    
    // 5. Verify Keys Tab is Locked
    const provisioningRestrictedBtn = page.getByRole('button', { name: /Provisioning Restricted/i });
    await expect(provisioningRestrictedBtn).toBeVisible();
    await expect(provisioningRestrictedBtn).toBeDisabled();
  });

  test('Superadmin Role: Delete modal rigorously enforces case-sensitive validation', async ({ page }) => {
    // 1. Intercept the guards fetch to inject a safe, temporary mock guard for the delete test
    // This prevents the automation from accidentally deleting real personnel in your database
    await page.route('**/rest/v1/guards*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ 
            id: 'mock-guard-id', 
            guard_name: 'Playwright Test Guard', 
            lesp_number: 'LESP-E2E-001', 
            lesp_expiry_date: '2030-01-01', 
            assigned_branch: null, 
            is_active: true 
        }]),
      });
    });

    // 2. Execute Real Superadmin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    await page.waitForURL('**/');
    await page.goto('/personnel');

    await expect(page.getByRole('heading', { name: 'Personnel & Provisioning' })).toBeVisible({ timeout: 35000 });

    // 3. Trigger the Delete Modal
    await page.getByTitle('Delete Guard').first().click();

    // 4. Verify Modal Rendering
    const modalHeading = page.getByRole('heading', { name: /Danger: Permanent Deletion/i });
    await expect(modalHeading).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: 'Confirm Delete' });
    
    // 5. Assertion: Button MUST be disabled initially
    await expect(confirmBtn).toBeDisabled();

    // 6. Assertion: Lowercase typing MUST fail the validation
    await page.fill('input[placeholder="DELETE"]', 'delete');
    await expect(confirmBtn).toBeDisabled();

    // 7. Assertion: Exact uppercase typing MUST unlock the button
    await page.fill('input[placeholder="DELETE"]', 'DELETE');
    await expect(confirmBtn).toBeEnabled();
  });

});