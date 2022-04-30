REM INITIALIZE A SUBTREE
REM call git add src/wwwroot
REM call git commit -m "Initial src/wwwroot subtree commit"

REM PUSH TO SUBTREE
REM from last commit
REM  don't have to push the commit to working branch, 
REM  but it's nice to have a reper ponit in git history
CALL git -C "../" subtree push --prefix src/wwwroot origin gh-pages