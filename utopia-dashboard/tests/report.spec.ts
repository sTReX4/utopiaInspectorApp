import { test, expect } from '@playwright/test';

test.describe('Reports Extraction - System Query Builder', () => {
  
  // Grant the suite 60 seconds total to allow Next.js Turbopack to compile
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // 1. Intercept the Dropdown Population queries
    await page.route('**/rest/v1/inspectors*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ full_name: 'Inspector Alpha' }, { full_name: 'Inspector Bravo' }]),
      });
    });

    await page.route('**/rest/v1/detachments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ branch_name: 'BDO Makati' }, { branch_name: 'BDO Alabang' }]),
      });
    });

    // 2. Execute Real Login Workflow
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    // 3. Navigate to Reports
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 35000 });
      
      await page.goto('/reports');
      await expect(page.getByRole('heading', { name: 'Data Extraction & Logs' })).toBeVisible({ timeout: 15000 });
    });

  test('Dropdowns populate and CSV Export strictly enforces payload constraints', async ({ page }) => {
    // 1. Verify Dropdowns Populated correctly from the mock DB
    const inspectorSelect = page.locator('select').filter({ hasText: '-- All Inspectors --' });
    await expect(inspectorSelect).toContainText('Inspector Alpha');

    const branchSelect = page.locator('select').filter({ hasText: '-- All Branches --' });
    await expect(branchSelect).toContainText('BDO Makati');

    // 2. Intercept the main Audit Query to simulate a successful search
    await page.route('**/rest/v1/audits*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'mock-audit-1',
          inspector_name: 'Inspector Alpha',
          time_in: '2026-08-30T08:00:00Z',
          branch_name: 'BDO Makati',
          guard_name: 'Juan Dela Cruz',
          violations_checklist: null
        }]),
      });
    });

    // 3. Run Query with empty filters
    await page.click('button:has-text("Run Query")');

    // 4. Verify Data Preview rendered the results
    await expect(page.getByText('1 Records Found')).toBeVisible();
    await expect(page.getByText('Juan Dela Cruz')).toBeVisible();

    // 5. Verify CSV is DISABLED (because Inspector and Date aren't explicitly set)
    const csvBtn = page.getByRole('button', { name: /Preview & Download CSV/i });
    await expect(csvBtn).toBeDisabled();
    await expect(page.getByText('Strict Filter Required:')).toBeVisible();

    // 6. Apply strict filters to satisfy the CSV requirement
    await inspectorSelect.selectOption('Inspector Alpha');
    await page.locator('input[type="date"]').first().fill('2026-08-30');
    
    // 7. Re-run query
    await page.click('button:has-text("Run Query")');
    
    // 8. Verify CSV button is now UNLOCKED and warning is gone
    await expect(csvBtn).toBeEnabled();
    await expect(page.getByText('Strict Filter Required:')).not.toBeVisible();
  });

  test('Clear Filters instantly resets all inputs and data arrays', async ({ page }) => {
    const inspectorSelect = page.locator('select').filter({ hasText: '-- All Inspectors --' });
    const startDateInput = page.locator('input[type="date"]').first();
    const violationsToggle = page.getByRole('checkbox', { name: /Show Violations Only/i });

    // 1. Manually fill fields and check toggles
    await inspectorSelect.selectOption('Inspector Alpha');
    await startDateInput.fill('2026-08-30');
    await violationsToggle.check();

    // 2. Trigger Clear Action
    await page.click('button:has-text("Clear Filters")');

    // 3. Verify aggressive UI reset
    await expect(inspectorSelect).toHaveValue('');
    await expect(startDateInput).toHaveValue('');
    await expect(violationsToggle).not.toBeChecked();
    
    // 4. Verify Data Preview array was wiped
    await expect(page.getByText('Awaiting Query')).toBeVisible();
  });

});