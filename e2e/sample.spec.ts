import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/*
 * The main path, start to finish, on the recorded sample: see a result,
 * open it, pick a dinner, add what is missing, cook, and find the list
 * waiting. The Workers are refused throughout, so a pass means the path
 * needs no AI, no account and no signal.
 */

/** Refuse every call to the Workers and the sign-in service, and remember them. */
async function offline(page: Page) {
  const calls: string[] = []
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => {
    const url = new URL(route.request().url())
    // the app asks once at start-up whether an AI and a session exist; nothing else is expected
    if (!['/v1/ai', '/v1/me'].includes(url.pathname)) calls.push(`${route.request().method()} ${url.pathname}`)
    return route.abort()
  })
  return calls
}

test('the sample path: photo to dinner to list, with nothing behind it', async ({ page }) => {
  const calls = await offline(page)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await test.step('the first screen shows a real result before asking for a photo', async () => {
    await page.goto('/app/')
    await expect(page.getByRole('heading', { level: 1, name: "What's in the fridge?" })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Photograph it' })).toBeVisible()
    await expect(page.getByText('10 things in, 5 dinners out')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Or cook one of these' })).toBeVisible()
  })

  await test.step('the sample opens with dinner in the first view', async () => {
    await page.getByRole('button', { name: 'Try a sample photo' }).click()
    await expect(page.getByRole('heading', { level: 1, name: '10 things in' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tonight' })).toBeVisible()

    const ideas = page.locator('.idea-btn')
    await expect(ideas).toHaveCount(5)
    // every idea has a picture; the first is wholly in view and the second has at
    // least its name in view (how much more depends on the device's own typeface)
    await expect(page.locator('.idea-thumb')).toHaveCount(5)
    const bar = (await page.getByRole('navigation', { name: 'Sections' }).boundingBox())!
    const first = (await ideas.nth(0).boundingBox())!
    const second = (await ideas.nth(1).locator('.idea-title').boundingBox())!
    expect(first.y + first.height, 'the first idea is above the tab bar').toBeLessThanOrEqual(bar.y)
    expect(second.y + second.height, "the second idea's name is above the tab bar").toBeLessThanOrEqual(bar.y)
  })

  await test.step('the ingredients can be opened, corrected and closed', async () => {
    await page.getByRole('button', { name: /more, edit/ }).click()
    await expect(page.getByRole('button', { name: 'Remove red cabbage' })).toBeVisible()
    await expect(page.locator('.magnet.is-full')).toHaveCount(10)
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.locator('.door.is-folded')).toBeVisible()
  })

  await test.step('a recipe leads with what to buy, and adds it in one tap', async () => {
    await page.getByRole('button', { name: /Vegetable Stir-Fry/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('heading', { name: 'Vegetable Stir-Fry' })).toBeVisible()
    await expect(sheet.getByRole('heading', { name: 'To buy · 2' })).toBeVisible()
    await expect(sheet.getByRole('heading', { name: 'You have · 3' })).toBeVisible()
    await expect(sheet.locator('.sheet-buy li')).toHaveText(['2 tablespoons soy sauce', '1 teaspoon grated ginger'])
    await expect(sheet.getByText('From the cupboard:')).toBeVisible()

    await sheet.getByRole('button', { name: 'Add both to the list' }).click()
    await expect(sheet.getByRole('status').filter({ hasText: 'On your list' })).toBeVisible()
    // the tab bar is hidden from assistive tech while the sheet is open, so read the badge directly
    await expect(page.locator('.tab-badge')).toHaveText('2')
  })

  await test.step('cooking shows the step, what it needs, and a timer where it names a time', async () => {
    await page.getByRole('button', { name: 'Cook step by step' }).click()
    await expect(page.locator('.cook-step')).toHaveText('Wash and chop the broccoli into small florets.')
    await expect(page.getByRole('list', { name: 'For this step' }).getByRole('listitem')).toHaveText(['150g broccoli'])
    await expect(page.getByRole('timer')).toHaveCount(0)

    for (let n = 0; n < 3; n++) await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.cook-step')).toContainText('stir-fry for 3-4 minutes')
    await expect(page.getByRole('list', { name: 'For this step' }).getByRole('listitem')).toHaveText(['150g broccoli', '50g green bell pepper'])
    await expect(page.getByRole('timer')).toContainText('4:00')
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('timer')).toContainText(/3:5\d/)

    // the timer keeps running on the next step, as a chip in the header
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('button', { name: 'Timer from step 4' })).toBeVisible()
  })

  await test.step('back closes cooking, then the recipe, then the results, and never leaves the app', async () => {
    await page.goBack()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Vegetable Stir-Fry' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: '10 things in' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: "What's in the fridge?" })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/app/')
  })

  await test.step('the list has both items, by shelf name, and survives a reload', async () => {
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: /List/ }).click()
    await expect(page.locator('.list-item-name')).toHaveText(['Grated ginger', 'Soy sauce'])
    await expect(page.getByText('for Vegetable Stir-Fry')).toHaveCount(2)

    await page.getByRole('button', { name: /^Soy sauce/, pressed: false }).click()
    await expect(page.getByText('Got it · 1')).toBeVisible()

    await page.reload()
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: /List/ }).click()
    await expect(page.getByText('To buy · 1')).toBeVisible()
    await expect(page.getByText('Got it · 1')).toBeVisible()
  })

  await test.step('nothing overflowed, nothing threw, and nothing was asked of the Workers', async () => {
    for (const tab of ['Fridge', 'List', 'Recipes']) {
      await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: new RegExp(tab) }).click()
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      expect(scroll, `${tab} fits the screen`).toBe(client)
    }
    expect(errors).toEqual([])
    expect(calls).toEqual([])
  })
})

test('the sample is never written into Recent', async ({ page }) => {
  await offline(page)
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Try a sample photo' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '10 things in' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('10 things in, 5 dinners out')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('feedme-history'))).toBeNull()
})

test('with no connection, the app says so and the list still works', async ({ page, context }) => {
  await offline(page)
  await page.goto('/app/')
  await expect(page.getByText('No connection.')).toHaveCount(0)

  await context.setOffline(true)
  await expect(page.getByRole('status').filter({ hasText: 'No connection.' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: /List/ }).click()
  await page.getByLabel('Add an item').fill('milk')
  await page.getByLabel('Add an item').press('Enter')
  await expect(page.locator('.list-item-name')).toHaveText(['Milk'])

  await context.setOffline(false)
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: /Fridge/ }).click()
  await expect(page.getByText('No connection.')).toHaveCount(0)
})

test('a recipe can be reported, with no account', async ({ page }) => {
  const reports: unknown[] = []
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/v1/reports') { reports.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { ok: true } }) }
    return route.abort()
  })
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Try a sample photo' }).click()
  await page.getByRole('button', { name: /Vegetable Stir-Fry/ }).click()
  const sheet = page.getByRole('dialog')

  await sheet.getByRole('button', { name: 'Report this recipe' }).click()
  await expect(sheet.getByRole('button', { name: 'Send report' })).toBeDisabled()
  await sheet.getByRole('radio', { name: /Wrong/ }).check()
  await sheet.getByLabel(/Anything to add/).fill('Step 3 says two minutes of heat for no reason.')
  await sheet.getByRole('button', { name: 'Send report' }).click()

  await expect(sheet.getByRole('status').filter({ hasText: 'Reported.' })).toBeVisible()
  expect(reports).toEqual([expect.objectContaining({ title: 'Vegetable Stir-Fry', reason: 'wrong', note: 'Step 3 says two minutes of heat for no reason.', steps: expect.any(Array) })])
})

test('signed in, deleting my data empties the list and saved recipes and signs out', async ({ page }) => {
  const server = { todos: [{ id: 't1', ingredient: '2 tablespoons soy sauce', recipeId: null, recipeName: 'Vegetable Stir-Fry', checked: false }], deleted: 0 }
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('feedme-session', 'demo.token'); sessionStorage.setItem('seeded', '1') } })
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => {
    const url = new URL(route.request().url()), method = route.request().method()
    if (url.pathname === '/v1/me') return route.fulfill({ json: { id: 'u1', name: 'Victor' } })
    if (url.pathname === '/v1/todos' && method === 'GET') return route.fulfill({ json: { todos: server.todos } })
    if (url.pathname.startsWith('/v1/favorites')) return route.fulfill({ json: { favorites: [] } })
    if (url.pathname === '/v1/account' && method === 'DELETE') { server.deleted++; server.todos = []; return route.fulfill({ json: { ok: true } }) }
    return route.abort()
  })
  await page.goto('/app/')
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: /List/ }).click()
  await expect(page.locator('.list-item-name')).toHaveText(['Soy sauce'])

  await page.getByRole('button', { name: /^Account/ }).click()
  const account = page.getByRole('dialog')
  await account.getByRole('button', { name: 'Delete my data' }).click()
  // a second, explicit step: nothing is deleted by one tap
  expect(server.deleted).toBe(0)
  await account.getByRole('button', { name: 'Yes, delete it all' }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(server.deleted).toBe(1)
  await expect(page.locator('.list-item')).toHaveCount(0)
  expect(await page.evaluate(() => [localStorage.getItem('feedme-session'), localStorage.getItem('feedme-list')])).toEqual([null, '[]'])
})

test("when today's free photos are used up, the first screen says so and still offers dinner", async ({ page }) => {
  let sent = 0
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/v1/ai') return route.fulfill({ json: { ready: true, plans: true } })
    if (url.pathname === '/v1/ai/identify') {
      sent++
      return route.fulfill({ status: 429, json: { error: "You've used today's 3 free photos. They come back tomorrow.", limit: 'photos', tier: 'free', used: 3, allowed: 3, per: 'day', resets: '2026-11-22T00:00:00.000Z' } })
    }
    if (url.pathname === '/v1/plan') return route.fulfill({ json: { tier: 'free', photos: { used: 3, allowed: 3, per: 'day', resets: '' }, compares: { used: 0, allowed: 2, per: 'week', resets: '' }, pictures: { used: 0, allowed: 0, per: 'month', resets: '' } } })
    return route.abort()
  })
  await page.goto('/app/')
  await page.locator('input[type="file"]').last().setInputFiles('public/food/sample-fridge.jpg')

  // the first photo ever: nothing is sent until the person says so
  await expect(page.getByRole('heading', { name: 'Before your first photo' })).toBeVisible()
  expect(sent, 'no photo leaves before consent').toBe(0)
  await page.getByRole('button', { name: 'Send my photo' }).click()

  const note = page.getByRole('status').filter({ hasText: "You've used today's 3 free photos." })
  await expect(note).toBeVisible()
  await expect(note).toContainText('They come back tomorrow.')
  // not a dead end: the ways to dinner that cost nothing are still on the screen
  await expect(page.getByRole('button', { name: 'Try a sample photo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Or cook one of these' })).toBeVisible()

  await page.getByRole('button', { name: /^Account/ }).click()
  await expect(page.getByRole('dialog').getByText('3 of 3 today')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('Free', { exact: true })).toBeVisible()
})

test('the product site is the home page and leads into the app', async ({ page }) => {
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: "What's in the fridge?" })).toBeVisible()
  await expect(page.locator('#root')).toHaveCount(0) // the site, not the app
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(scroll, 'the site fits the screen').toBe(client)

  for (const path of ['/privacy/', '/support/']) {
    const res = await page.request.get(path)
    expect(res.status(), path).toBe(200)
  }

  // "Try a sample photo" lands on a result, and the address is left clean
  await page.getByRole('link', { name: 'Try a sample photo' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: '10 things in' })).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/app/')

  await page.goto('/')
  await page.getByRole('link', { name: 'Open the app' }).first().click()
  await expect(page.getByRole('button', { name: 'Photograph it' })).toBeVisible()
})

test('a photo with no food in it is said plainly, and the list can be typed in instead', async ({ page }) => {
  await page.route(/workers\.dev|api\.victorsaly\.com/, (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/v1/ai') return route.fulfill({ json: { ready: true, plans: true } })
    if (url.pathname === '/v1/ai/identify') return route.fulfill({ json: { ingredients: [], seen: 'a cat on a sofa' } })
    if (url.pathname === '/v1/ai/suggest') return route.fulfill({ json: { ideas: [{ title: 'Omelette', blurb: 'Eggs, quickly.', minutes: 10, uses: ['eggs'], missing: [] }] } })
    return route.abort()
  })
  await page.addInitScript(() => localStorage.setItem('feedme-ai-consent', 'yes'))
  await page.goto('/app/')
  await page.locator('input[type="file"]').last().setInputFiles('public/food/sample-fridge.jpg')

  const note = page.getByRole('status').filter({ hasText: 'No food in that photo.' })
  await expect(note).toBeVisible()
  await expect(note).toContainText('It looks like a cat on a sofa.')
  await expect(note).toContainText('wasn’t counted')
  await expect(page.getByRole('heading', { level: 1, name: "What's in the fridge?" })).toBeVisible() // still the first screen

  await page.getByRole('button', { name: 'Type in what you have' }).click()
  await page.getByLabel('Add an ingredient').fill('eggs')
  await page.getByLabel('Add an ingredient').press('Enter')
  await page.getByRole('button', { name: 'Get ideas' }).click()
  await expect(page.getByRole('button', { name: /Omelette/ })).toBeVisible()
})

test('cooking can save the recipe, and pictures each step on request', async ({ page }) => {
  const sample = JSON.parse(readFileSync('src/data/sample.json', 'utf8')) as { ideas: { title: string; recipe: { steps: string[] } }[] }
  const steps = sample.ideas.find((i) => i.title === 'Roasted Vegetable Medley')!.recipe.steps.length
  const asked: number[] = []
  const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  await page.route(/workers\.dev|api\.victorsaly\.com/, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/v1/ai') return route.fulfill({ json: { ready: true, plans: true } })
    if (url.pathname === '/v1/ai/step-picture') {
      const n = route.request().postDataJSON().n
      asked.push(n)
      return route.fulfill({ json: { url: `https://feedmeai-api.still-union-ef8a.workers.dev/v1/pictures/${String(n).padStart(32, 'a')}` } })
    }
    if (url.pathname.startsWith('/v1/pictures/')) return route.fulfill({ contentType: 'image/png', body: Buffer.from(pixel, 'base64') })
    return route.abort()
  })
  await page.goto('/app/?sample')
  await page.getByRole('button', { name: /Roasted Vegetable Medley/ }).click()
  await page.getByRole('button', { name: 'Cook step by step' }).click()

  // Save is always to hand while cooking
  await page.getByRole('button', { name: 'Save', pressed: false }).click()
  await expect(page.getByRole('button', { name: 'Saved', pressed: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('feedme-saved') ?? '[]').map((r: { title: string }) => r.title))).toEqual(['Roasted Vegetable Medley'])

  // nothing is drawn until asked; then the step on screen comes first and every step gets one
  expect(asked).toEqual([])
  await page.getByRole('button', { name: 'Picture each step' }).click()
  await expect(page.getByRole('img', { name: /^Step 1:/ })).toBeVisible()
  await expect.poll(() => asked.length).toBe(steps)
  expect(asked[0]).toBe(0)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('img', { name: /^Step 2:/ })).toBeVisible()

  // kept with the recipe: back and in again draws nothing new
  await page.goBack()
  await page.getByRole('button', { name: 'Cook step by step' }).click()
  await expect(page.getByRole('img', { name: /^Step 1:/ })).toBeVisible()
  expect(asked.length).toBe(steps)
})
