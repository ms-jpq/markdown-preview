import { Command } from "commander"
import { isfile, slurp } from "nda/dist/node/fs"
import { dirname, join } from "path"

export type Arguments = {
  markdown: string
  port: number
  delay: number
}

export const argparse = async (): Promise<Arguments> => {
  const prog = new Command()
  prog.storeOptionsAsProperties(false)

  const pkg_data = await slurp(join(dirname(__dirname), "package.json"))
  const pkg_info = JSON.parse(pkg_data)
  prog.name(pkg_info["name"])
  prog.version(pkg_info["version"])

  prog.arguments("<markdown>")
  prog.option("-p, --port <port>", "PORT", Number, 8080)
  prog.option("-d, --delay <delay>", "DELAY", Number, 500)

  await prog.parseAsync(process.argv)
  if (prog.args.length != 1) {
    console.error(prog.helpInformation())
    process.exit(1)
  }
  const [markdown] = prog.args
  const args = prog.opts()

  if (!(await isfile(markdown))) {
    console.error(`Not a file -- ${markdown}`)
    process.exit(1)
  }

  return { ...args, markdown } as Arguments
}
