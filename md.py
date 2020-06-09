#!/usr/bin/env python3

from argparse import ArgumentParser, Namespace
from http.server import ThreadingHTTPServer
from os import getcwd, environ
from os.path import basename, dirname, isdir, join, splitext
from typing import Any, Callable, Dict, List
from sys import stderr


try:
  import jinja2
  import markdown
except ImportError:
  if environ.get("VIRTUAL_ENV") is None:
    venv_home = join(getcwd(), ".venv")
    if isdir(venv_home):
      print(f"Please Source VENV - {venv_home}", file=stderr)
    else:
      from venv import create
      create(venv_home, with_pip=True)
      print(f"Installed VENV - {venv_home}", file=stderr)
    exit(1)
  else:
    from subprocess import run
    run(["pip", "install", "jinja2", "markdown"])


from jinja2 import Environment, FileSystemLoader,  StrictUndefined
from markdown import markdown


def parse_args() -> Namespace:
  parser = ArgumentParser()
  parser.add_argument("markdown")
  return parser.parse_args()


def build_j2(src: str, filters: Dict[str, Callable] = {}) -> Environment:
  j2 = Environment(
      enable_async=True,
      trim_blocks=True,
      lstrip_blocks=True,
      undefined=StrictUndefined,
      loader=FileSystemLoader(src))
  j2.filters = {**j2.filters, **filters}
  return j2


def render_j2(dest: str, values: Dict[str, Any]) -> None:
  full, _ = splitext(dest)
  base = basename(full)
  parent = dirname(full)
  template = basename(dest)
  j2 = build_j2(parent)
  content = j2.get_template(template).render(**values)


def slurp(name) -> str:
  with open(name) as fd:
    return fd.read()


def md_html(name: str) -> str:
  md = slurp(name)
  return markdown.markdown(md)


def srv(name: str) -> str:
  return 2


def main() -> None:
  args = parse_args()
  md_html(args.markdown)


try:
  main()
except KeyboardInterrupt:
  pass
#!/usr/bin/env python3

