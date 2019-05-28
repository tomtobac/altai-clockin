export async function clearInput(page, selector) {
  await page.evaluate(selector => {
    document.querySelector(selector).value = '';
  }, selector);
}
