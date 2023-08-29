# Project
[work in progress] Browser base Free Transform for OBS. _Requires [OBS WebSocket](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/) and [StreamFX](https://obsproject.com/forum/threads/streamfx-for-obs%C2%AE-studio.76619/) OBS plugins_.

Site: https://m4ryu5.github.io/OBS-3DTransform-MovePoints/
![3d_transform_example](https://github.com/M4rYu5/OBS-3DTransform-MovePoints/assets/30922014/6657f186-93a0-4417-be62-f362fca87ac3)





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
## Auth
If you're a dev, and want to create an authentication system for OBS, you have [here](./other/dev_websocket.md) an example of inputs and outputs for each step (`C#` & `JavaScript`).
## Useful Links
- [obs-websocket protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getgroupsceneitemlist)
- [3D Transform Filter](https://github.com/Xaymar/obs-StreamFX/wiki/Filter-3D-Transform)
