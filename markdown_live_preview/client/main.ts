import { sleep, tiktok } from "nda/dist/isomorphic/prelude"
import { $, $$, wait_frame } from "nda/dist/browser/dom"

const CYCLE = 500

const display = $("#main")!
const title = $("#title")!

type API = { title: string; sha: string; follow: boolean }

const api_request = async (): Promise<API> =>
  await (await fetch(`${location.origin}/api/info`)).json()

const ws_connect = async function* <T>() {
  const remote = `ws://${location.host}/ws`
  let cb: (_: T) => void = () => { }
  let ws = new WebSocket(remote)

  const provision = () => {
    ws.onmessage = ({ data }) => cb(data)
    ws.onclose = async () => {
      await sleep(CYCLE)
      ws = new WebSocket(remote)
      provision()
    }
  }
  provision()

  while (true) {
    const next = new Promise<T>((resolve) => (cb = resolve))
    yield next
  }
}

const update = async (follow: boolean) => {
  const page = await (await fetch(`${location.origin}/api/markdown`)).text()
  display.innerHTML = page

  await wait_frame()
  const marked = $$(`[diff="True"]`)
  const [focus, ..._] = marked

  if (focus) {
    if (follow) {
      focus.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    }
  }
}

const main = async () => {
  const info = await api_request()
  document.title = info.title
  title.textContent = info.title

  const loop1 = async () => {
    while (true) {
      try {
        for await (const _ of ws_connect<unknown>()) {
          await update(info.follow)
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const loop2 = async () => {
    let sha: string | undefined = undefined
    for await (const _ of tiktok(CYCLE)) {
      try {
        const info = await api_request()
        if (info.sha !== sha) {
          await update(info.follow)
          sha = info.sha
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  await Promise.all([loop1(), loop2()])
}

main()
