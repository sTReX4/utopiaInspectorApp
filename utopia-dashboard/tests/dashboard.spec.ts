import { test, expect } from '@playwright/test';

test.describe('RBAC Routing & UI Enforcers', () => {

  test.setTimeout(60000);

  test('Admin Role: Locked out of Superadmin features on /sites', async ({ page }) => {
    // 1. Execute Real Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 35000 });
    await page.goto('/sites');

    // Assert "Add Detachment" button is disabled for Admin
    const addBtn = page.getByRole('button', { name: /Add Detachment/i });
    await expect(addBtn).toBeDisabled();

    // Assert Read-Only badge is visible
    await expect(page.getByText('Partial Access')).toBeVisible();
  });

  test('Admin Role: Directly blocked from accessing /escalations', async ({ page }) => {
    // 1. Execute Real Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 35000 });
    await page.goto('/escalations');
    
    // Assert Access Restricted barrier appears
    await expect(page.getByRole('heading', { name: 'Access Restricted' })).toBeVisible();
    await expect(page.getByText('The QC Escalations queue is restricted to Superadmin personnel.')).toBeVisible();
  });
});