import { test, expect } from '@playwright/test';

test('Opens detail panel and alerts on >100m GPS Mismatch', async ({ page }) => {
    // 1. Intercept audit feed query to provide the mock card and detail data
    await page.route('**/rest/v1/audits*', async (route) => {
      const mockAudit = {
        id: 'audit-999',
        branch_name: 'UnionBank Makati',
        branch_code: 'UB-MAK-01',
        inspector_name: 'Inspector Alex',
        gps_latitude: 14.5547,
        gps_longitude: 121.0244,
        time_in: new Date().toISOString(),
        violations_checklist: { no_pershing_cap: true },
      };

      // Supabase .single() requests append the specific ID to the query string
      const isSingleRecord = route.request().url().includes('id=eq.audit-999');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        // Dynamically return an Object for .single() queries, and an Array for list queries
        body: JSON.stringify(isSingleRecord ? mockAudit : [mockAudit]),
      });
    });

    // 2. Execute Real Login Workflow
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@utopiasecurity.com');
    await page.fill('input[type="password"]', 'Utopia2026!');
    await page.click('button:has-text("Authenticate System")');

    // 3. Wait for the secure redirect to the Dashboard
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible({ timeout: 35000 });
    
    // 4. Click audit card
    await page.click('text=UnionBank Makati');

    // 5. Assert detail panel opens
    await expect(page.getByText('Audit Inspection Report')).toBeVisible();
    
    // 6. Assert QC Escalation banner triggers for violations
    await expect(page.getByText('⚠️ QC/TBD Manager Review Required')).toBeVisible();
  });