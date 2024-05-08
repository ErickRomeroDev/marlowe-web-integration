git status				**Check if the branch is up-to-date

git branch -vv				**TO SEE LATEST INFO OF THE BRANCH
git branch -a				**To see the branch and the remote branch is connected

git log --oneline --graph

git remote -v                             **to see the link of your origin
git remote set-url origin new-url	  ** TO UPDATE THE url OF YOUR ORIGIN

git clone [link of repository]

git checkout -b localBranchName      ***creates a new branch base on the actual branch
git checkout feature-branch           ***gpes to the feature branch

//procedure to keep your feature branch updated before merging
git checkout feature-branch
git fetch origin
git merge origin/main


•	git config –global user.email “erickrs2esuares@gmail.com”
•	git config –global user.name “Erickrs2”