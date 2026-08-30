import { test, expect } from '@playwright/test';

test.describe('Enterprise RBAC & Authentication Gates', () => {

  test('Superadmin Authentication: Full CRUD Unlocked', async ({ page }) => {
    // 1. Execute Real Login Workflow (Network Mocks Removed)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    // 2. Wait for Supabase to establish the real session and redirect
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
    await page.goto('/sites');

    // 3. Verify Superadmin UI Rendering
    const addDetachmentBtn = page.getByRole('button', { name: /Add Detachment/i });
    await expect(addDetachmentBtn).toBeVisible();
    await expect(addDetachmentBtn).toBeEnabled();
    
    const readOnlyBadge = page.getByText('Read Only Access');
    await expect(readOnlyBadge).not.toBeVisible();
  });

  test('Admin (RBO) Authentication: Destructive Actions Locked', async ({ page }) => {
    // 1. Execute Real Login Workflow (Network Mocks Removed)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    // 2. Wait for Supabase to establish the real session and redirect
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
    await page.goto('/sites');

    // 3. Verify Admin UI Constraints
    const addDetachmentBtn = page.getByRole('button', { name: /Add Detachment/i });
    await expect(addDetachmentBtn).toBeVisible();
    await expect(addDetachmentBtn).toBeDisabled();
    
    const readOnlyBadge = page.getByText('Partial Access');
    await expect(readOnlyBadge).toBeVisible();
  });

});