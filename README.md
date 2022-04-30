# WIP

# Project
  Work in progress project that will connect to [OBS WebSocket](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/) and allows easier contorol of [StreamFX](https://obsproject.com/forum/threads/streamfx-for-obs%C2%AE-studio.76619/) 3D Transform.

## Structure
- `{root}`: repository related files
- `.vscode`: adds build task (shortcut & pre-debug) for vs code
- `scripts`: scripts used in development for various tasks
- `src`: any project related folders or files
- `src/ts`: TypeScript files
- `src/wwwroot`: all site static files (ready to be deployed on github pages)
- `src/wwwroot`: will be pushed to `gh-pages` (subtree) branch, using `scripts/commit_git-pages.bat`
- `other`: anything that is not directly related to this repository.


# Dev
If you're a dev, and want to create an authentication system for OBS, you have [here](./other/dev_websocket.md) an example of inputs and outputs for each step (`C#` & `JavaScript`).
