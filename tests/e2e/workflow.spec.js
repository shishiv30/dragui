import { test, expect } from "@playwright/test";

test.describe("DragUI Workflow Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Initial State", () => {
    test("should load the application", async ({ page }) => {
      await expect(page).toHaveTitle(/DragUI/);
      await expect(page.locator("h1")).toContainText("DragUI");
    });

    test("should show available components in sidebar", async ({ page }) => {
      const sidebar = page.locator(".sidebar");
      await expect(sidebar).toBeVisible();

      await expect(page.locator("text=📁 Upload Image")).toBeVisible();
      await expect(page.locator("text=🎨 Image Filter")).toBeVisible();
      await expect(page.locator("text=🔧 Image Repair")).toBeVisible();
      await expect(page.locator("text=🖼️ Preview")).toBeVisible();
    });

    test("should show empty canvas initially", async ({ page }) => {
      const canvas = page.locator(".canvas-container");
      await expect(canvas).toBeVisible();

      // Should not have any workflow nodes initially
      const nodes = page.locator(".workflow-node");
      await expect(nodes).toHaveCount(0);
    });

    test("should show control buttons", async ({ page }) => {
      await expect(page.locator('button:has-text("Save")')).toBeVisible();
      await expect(page.locator('button:has-text("Load")')).toBeVisible();
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
      await expect(page.locator('button:has-text("Export")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Run Workflow")')
      ).toBeVisible();
    });
  });

  test.describe("Drag and Drop", () => {
    test("should allow dragging upload component to canvas", async ({
      page,
    }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);

      const nodes = page.locator(".workflow-node");
      await expect(nodes).toHaveCount(1);
      await expect(
        page.locator('.workflow-node:has-text("Upload Image")')
      ).toBeVisible();
    });

    test("should allow dragging multiple components", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);

      const nodes = page.locator(".workflow-node");
      await expect(nodes).toHaveCount(2);
      await expect(
        page.locator('.workflow-node:has-text("Upload Image")')
      ).toBeVisible();
      await expect(
        page.locator('.workflow-node:has-text("Image Filter")')
      ).toBeVisible();
    });

    test("should show connections between components", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);

      // Should show connection lines
      const connections = page.locator(".connection-line");
      await expect(connections).toHaveCount(1);
    });

    test("should prevent adding filter without upload", async ({ page }) => {
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      // Try to drag filter without upload
      await filterComponent.dragTo(canvas);

      // Should show error or not add the component
      const nodes = page.locator(".workflow-node");
      await expect(nodes).toHaveCount(0);
    });
  });

  test.describe("Form Interactions", () => {
    test("should open upload form when clicking upload node", async ({
      page,
    }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await page.locator('.workflow-node:has-text("Upload Image")').click();

      // Should show upload form
      await expect(page.locator("text=Image")).toBeVisible();
      await expect(page.locator("text=Description")).toBeVisible();
    });

    test("should open filter form when clicking filter node", async ({
      page,
    }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);

      await page.locator('.workflow-node:has-text("Image Filter")').click();

      // Should show filter form
      await expect(page.locator("text=White Balance")).toBeVisible();
      await expect(page.locator("text=Exposure")).toBeVisible();
    });

    test("should open repair form when clicking repair node", async ({
      page,
    }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const repairComponent = page.locator(
        '.component-item:has-text("🔧 Image Repair")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await repairComponent.dragTo(canvas);

      await page.locator('.workflow-node:has-text("Image Repair")').click();

      // Should show repair form
      await expect(page.locator("text=Detail Level")).toBeVisible();
    });

    test("should allow adjusting range sliders", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);

      await page.locator('.workflow-node:has-text("Image Filter")').click();

      const wbSlider = page.locator('input[type="range"]').first();
      await wbSlider.fill("50");

      // Should update the value
      await expect(wbSlider).toHaveValue("50");
    });
  });

  test.describe("Image Upload", () => {
    test("should allow file upload via file input", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await page.locator('.workflow-node:has-text("Upload Image")').click();

      // Create a test file
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.locator('input[type="file"]').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles("tests/fixtures/test-image.jpg");

      // Should show image preview
      await expect(page.locator("img")).toBeVisible();
    });

    test("should allow drag and drop file upload", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await page.locator('.workflow-node:has-text("Upload Image")').click();

      const uploadArea = page.locator(".upload-area");

      // Simulate file drop
      await uploadArea.dispatchEvent("drop", {
        dataTransfer: {
          files: [new File(["test"], "test.jpg", { type: "image/jpeg" })],
        },
      });

      // Should show image preview
      await expect(page.locator("img")).toBeVisible();
    });
  });

  test.describe("Workflow Validation", () => {
    test("should show validation errors for incomplete workflow", async ({
      page,
    }) => {
      // Try to run workflow without components
      await page.locator('button:has-text("Run Workflow")').click();

      // Should show validation errors
      await expect(page.locator(".validation-error")).toBeVisible();
    });

    test("should validate complete workflow", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const previewComponent = page.locator(
        '.component-item:has-text("🖼️ Preview")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);
      await previewComponent.dragTo(canvas);

      // Should not show validation errors
      await expect(page.locator(".validation-error")).not.toBeVisible();
    });
  });

  test.describe("Workflow Persistence", () => {
    test("should save and load workflow", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const filterComponent = page.locator(
        '.component-item:has-text("🎨 Image Filter")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await filterComponent.dragTo(canvas);

      // Save workflow
      await page.locator('button:has-text("Save")').click();

      // Clear workflow
      await page.locator('button:has-text("Clear")').click();
      await expect(page.locator(".workflow-node")).toHaveCount(0);

      // Load workflow
      await page.locator('button:has-text("Load")').click();
      await expect(page.locator(".workflow-node")).toHaveCount(2);
    });

    test("should export workflow as JSON", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);

      // Export workflow
      const downloadPromise = page.waitForEvent("download");
      await page.locator('button:has-text("Export")').click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain("workflow");
    });
  });

  test.describe("Zoom Controls", () => {
    test("should zoom in and out", async ({ page }) => {
      const zoomInButton = page.locator('button:has-text("+")');
      const zoomOutButton = page.locator('button:has-text("-")');
      const resetButton = page.locator('button:has-text("Reset")');

      // Test zoom in
      await zoomInButton.click();
      await expect(page.locator(".canvas-container")).toHaveCSS(
        "transform",
        /scale\(1\.2\)/
      );

      // Test zoom out
      await zoomOutButton.click();
      await expect(page.locator(".canvas-container")).toHaveCSS(
        "transform",
        /scale\(1\)/
      );

      // Test reset
      await zoomInButton.click();
      await zoomInButton.click();
      await resetButton.click();
      await expect(page.locator(".canvas-container")).toHaveCSS(
        "transform",
        /scale\(1\)/
      );
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should work on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator(".sidebar")).toBeVisible();
      await expect(page.locator(".canvas-container")).toBeVisible();

      // Test touch interactions
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);
      await expect(page.locator(".workflow-node")).toHaveCount(1);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle ComfyUI connection errors gracefully", async ({
      page,
    }) => {
      // Mock ComfyUI as unavailable
      await page.route("http://127.0.0.1:8188/system_stats", (route) => {
        route.abort();
      });

      await page.goto("/");

      // Should show connection status
      await expect(page.locator("text=Disconnected")).toBeVisible();
    });

    test("should handle workflow execution errors", async ({ page }) => {
      const uploadComponent = page.locator(
        '.component-item:has-text("📁 Upload Image")'
      );
      const canvas = page.locator(".canvas-container");

      await uploadComponent.dragTo(canvas);

      // Mock execution error
      await page.route("http://127.0.0.1:8188/prompt", (route) => {
        route.fulfill({ status: 500, body: "Internal Server Error" });
      });

      await page.locator('button:has-text("Run Workflow")').click();

      // Should show error message
      await expect(page.locator(".error-message")).toBeVisible();
    });
  });
});
